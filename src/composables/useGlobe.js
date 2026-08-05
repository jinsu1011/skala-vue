import { ref, onUnmounted } from 'vue'
import Globe from 'globe.gl'
import * as THREE from 'three'
import countriesGeoJson from '@/assets/world-countries.json'
import { getLandmark, hasLandmark } from '@/data/landmarkData'
import { buildLandmarkModel, disposeLandmarkModel } from '@/three/landmarkModels'

/**
 * 🌍 useGlobe Composable — "모형(模型) 경계 지형 지구본" 버전
 *
 * 나라 경계 좌표(GeoJSON)로 각 지형 다각형을 정교하게 다듬은 모형 지구본입니다.
 */

// 지구본 바다(구체 본체) 색
const OCEAN_COLOR = '#0b2545'
// 나라를 칠할 색 팔레트 (인접국이 같은 색이 되지 않도록 순서대로 돌려 씁니다)
const LAND_PALETTE = ['#1e6f5c', '#2a7f62', '#3f8f5f', '#4f9d69', '#37806b', '#2f7d74']

export function useGlobe() {
  let globe = null
  let starField = null // 절차적으로 만든 별 배경
  let layerMesh = null // 기상 오버레이 Mesh
  let layerAnimId = null

  let resizeHandler = null
  let resizeObserver = null
  let controlsChangeHandler = null // 확대/축소 감지 핸들러 (정리용으로 보관)
  let markerScaleRafId = null

  /*
   * 렌더링 일시정지 관련 (성능 최적화용)
   *
   * 멈춰야 할 이유가 여러 개입니다.
   *  - 'offscreen' : 스크롤해서 지구본이 화면 밖으로 나감
   *  - 'hidden'    : 다른 탭으로 이동함
   *  - 'covered'   : 모바일에서 Bottom Sheet 가 지구본을 완전히 덮음
   *
   * 이유를 Set 에 모아 두고 **하나라도 남아 있으면 멈춘 상태**를 유지합니다.
   * 단순 true/false 하나로 관리하면, 예를 들어 시트를 닫는 순간
   * "탭이 숨겨져 있다"는 사실까지 같이 지워져 버려서
   * 반대로 지구본이 영영 멈추거나 엉뚱하게 다시 도는 사고가 납니다.
   */
  const pauseReasons = new Set()
  let isPaused = false
  let layerSpinEnabled = false // 현재 레이어가 회전 애니메이션을 쓰는지
  let intersectionObserver = null
  let visibilityHandler = null

  /** 기상 레이어 상태 (버튼 스피너/에러 표시용) */
  const layerStatus = ref({ active: 'none', loading: false, error: null })

  /*
   * 🔍 줌 레벨에 따른 마커 표시 단계 (LOD, Level Of Detail)
   *
   * ▶ 왜 필요한가?
   * 국내 8개 도시는 실제로 아주 가까이 붙어 있습니다.
   * 지구본을 멀리서 보면 한반도가 손톱만 하게 보이는데 그 위에
   * 마커 8개가 겹쳐 쌓여 글씨를 읽을 수 없고, 보이지도 않는 마커를
   * 매 프레임 위치 계산하느라 느려지기까지 합니다.
   *
   * ▶ 어떻게 하나?
   * - 멀리(far): 국내는 **서울 하나만** 대표로 보여 줍니다. 해외 도시는 서로 멀리
   *   떨어져 있어 겹치지 않으므로 그대로 둡니다.
   * - 가까이(near): 국내 8개 도시를 모두 펼쳐 보여 줍니다.
   */
  const KR_REPRESENTATIVE_ID = 'city_01' // 서울

  /*
   * 단계가 바뀌는 기준 높이(altitude).
   * 이 앱에서 쓸 수 있는 범위는 약 0.3(최대 확대) ~ 4.0(최대 축소)이고,
   * 처음 보여 주는 화면은 2.2, 도시를 고르면 0.38 까지 내려갑니다.
   *
   * 두 값을 다르게 둔 이유(히스테리시스): 기준이 하나뿐이면 그 경계에서
   * 휠을 조금만 굴려도 마커 7개가 생겼다 사라졌다를 반복해 눈이 아픕니다.
   * 「0.95 위로 올라가야 접히고, 0.7 아래로 내려가야 펼쳐진다」로 두면
   * 그 사이 구간에서는 지금 상태를 그대로 유지합니다.
   */
  const LOD_FAR_ABOVE = 0.95 // 이보다 높이 올라가면 '멀리' (서울만)
  const LOD_NEAR_BELOW = 0.7 // 이보다 내려오면 '가까이' (국내 8곳 전부)

  let markerCities = [] // 전체 도시 데이터 원본
  let markerClickHandler = () => {}
  let markerLod = null // 'far' | 'near'

  /*
   * 🏛️ 랜드마크 3D 모형 (구글어스처럼 지면에 서 있는 입체 모형)
   *
   * 나라 다각형이 지표면에서 0.012 만큼 솟아 있으므로, 모형도 그 바로 위에
   * 세워야 땅에 파묻히지 않고 **지면을 딛고 선** 것처럼 보입니다.
   *
   * 모형은 도시마다 한 번만 만들어 Map 에 넣어 두고 재사용합니다.
   * (줌 단계가 바뀔 때마다 다시 만들면 매번 수십 개의 도형을 새로 깎게 됩니다)
   *
   * 표시 기준도 마커 LOD 와 같은 이유로 두 단계를 둡니다.
   * 멀리서 보면 모형이 점만 해져 화면만 지저분해지고 그리기 비용만 나가므로,
   * 0.9 아래로 내려오면 세우고 1.3 위로 올라가면 치웁니다.
   */
  const LANDMARK_ALTITUDE = 0.013
  const LANDMARK_SHOW_BELOW = 0.9
  const LANDMARK_HIDE_ABOVE = 1.3

  const landmarkModels = new Map() // cityId → THREE.Group
  let landmarksVisible = false

  /** 도시의 랜드마크 모형을 가져옵니다 (처음 한 번만 만듭니다) */
  const getLandmarkModel = (cityId) => {
    if (landmarkModels.has(cityId)) return landmarkModels.get(cityId)

    const lm = getLandmark(cityId)
    const model = buildLandmarkModel(lm?.model, {
      scale: lm?.scale ?? 1,
      heading: lm?.heading ?? 0,
    })
    landmarkModels.set(cityId, model)
    return model
  }

  /** 모형이 준비된 도시만 추립니다 */
  const citiesWithLandmark = () => markerCities.filter((c) => hasLandmark(c.id))

  /** 현재 카메라 높이에 맞춰 모형을 세우거나 치웁니다 */
  const syncLandmarks = (alt) => {
    if (!globe) return

    const next =
      alt <= LANDMARK_SHOW_BELOW ? true : alt >= LANDMARK_HIDE_ABOVE ? false : landmarksVisible

    if (next === landmarksVisible) return
    landmarksVisible = next
    globe.objectsData(next ? citiesWithLandmark() : [])
  }

  /*
   * 🛩️ 비스듬히 내려다보기 (틸트-시프트)
   *
   * ▶ 문제
   * 지구본 카메라는 **항상 지구 중심을 바라보도록** 고정돼 있습니다.
   * 그래서 도시를 화면 한가운데 두면 그 도시를 정확히 정수리에서 내려다보게 되고,
   * 위로 솟은 탑은 납작한 점이 돼 버립니다.
   *
   * ▶ 해결
   * 두 가지를 같이 씁니다.
   *  1) 카메라를 도시보다 조금 남쪽에 세웁니다 (아래 FLY_TILT_DEG).
   *     그러면 도시를 옆에서 비스듬히 보게 되지만, 도시가 화면 위쪽으로 밀려
   *     상단 검색 바에 가려집니다.
   *  2) 그래서 렌즈만 위로 밀어(setViewOffset) 도시를 화면 가운데로 되돌립니다.
   *     사진에서 높은 건물을 담을 때 쓰는 **틸트-시프트 렌즈**와 같은 원리로,
   *     카메라를 억지로 돌리지 않고 화각만 옮기는 것이라
   *     globe.gl 의 카메라 제어와 부딪히지 않습니다.
   *
   * 결과적으로 시선이 지면과 이루는 각이 약 21° → 32° 로 눕습니다.
   */
  const VIEW_SHIFT_MAX = 0.52 // 화면 높이의 몇 배만큼 렌즈를 밀어 올릴지
  const VIEW_SHIFT_FROM = 1.3 // 이 고도부터 서서히 눕기 시작
  const VIEW_SHIFT_TO = 0.38 // 이 고도에서 최대로 눕음

  /**
   * 고도에 맞춰 렌즈 이동량을 갱신합니다.
   * 갑자기 툭 튀지 않도록 고도에 따라 부드럽게 이어집니다.
   */
  const applyViewShift = (alt) => {
    const camera = globe?.camera()
    if (!camera) return

    const width = globe.width() || 1
    const height = globe.height() || 1

    const progress = (VIEW_SHIFT_FROM - alt) / (VIEW_SHIFT_FROM - VIEW_SHIFT_TO)
    const shift = Math.max(0, Math.min(1, progress)) * VIEW_SHIFT_MAX

    if (shift < 0.001) {
      camera.clearViewOffset()
      return
    }

    // offsetY 를 음수로 주면 절두체가 위로 올라가고, 화면 내용은 그만큼 내려옵니다
    camera.setViewOffset(width, height, 0, -height * shift, width, height)
  }

  /** 현재 높이에서 어떤 단계여야 하는지 결정 (중간 구간은 지금 단계를 유지) */
  const resolveLod = (alt, current) => {
    if (alt >= LOD_FAR_ABOVE) return 'far'
    if (alt <= LOD_NEAR_BELOW) return 'near'
    return current ?? 'far'
  }

  /** 단계에 맞게 실제로 보여 줄 도시만 걸러냅니다 */
  const citiesForLod = (list, lod) =>
    lod === 'far'
      ? list.filter((c) => c.countryGroup !== 'KR' || c.id === KR_REPRESENTATIVE_ID)
      : list

  // 마커 그룹별 색상
  const groupColors = {
    clear: '#facc15', // 노랑
    cloud: '#94a3b8', // 회색
    rain: '#38bdf8', // 파랑
    snow: '#e0f2fe', // 하늘색
    fog: '#cbd5e1', // 밝은 회색
    storm: '#a855f7', // 보라
  }

  /**
   * 별이 빛나는 우주 배경
   */
  const createStarField = (radius) => {
    const count = 2000
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.6,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    })

    return new THREE.Points(geometry, material)
  }

  /**
   * ⏸️ 지구본 렌더링 일시정지 / 재개
   *
   * ▶ 왜 필요한가? (성능 최적화의 핵심)
   * globe.gl 은 화면에 보이든 말든 **1초에 60번 쉬지 않고** 지구본을 다시 그립니다.
   * 우리 지구본은 나라 285개를 각각 따로 그리기 때문에 한 프레임에만
   * 570번의 그리기 명령(드로우콜)이 나갑니다.
   * 사용자가 아래로 스크롤해 상세 날씨를 읽는 동안에도, 모바일에서 시트가
   * 지구본을 완전히 덮고 있는 동안에도 이 작업이 계속되니 화면 전체가 버벅입니다.
   * → "안 보이면 아예 그리지 않는다"가 가장 확실한 해결책입니다.
   */
  /** 남아 있는 이유에 따라 실제 렌더링을 멈추거나 재개합니다 */
  const applyPauseState = () => {
    if (!globe) return
    const shouldPause = pauseReasons.size > 0
    if (shouldPause === isPaused) return // 상태가 그대로면 아무것도 하지 않습니다

    isPaused = shouldPause

    if (shouldPause) {
      globe.pauseAnimation()
      // 구름 레이어 회전 루프도 같이 멈춥니다
      if (layerAnimId) {
        cancelAnimationFrame(layerAnimId)
        layerAnimId = null
      }
    } else {
      globe.resumeAnimation()
      startLayerSpin() // 멈춰뒀던 구름 회전 다시 시작
    }
  }

  const pauseRendering = (reason = 'covered') => {
    pauseReasons.add(reason)
    applyPauseState()
  }

  const resumeRendering = (reason = 'covered') => {
    pauseReasons.delete(reason)
    applyPauseState()
  }

  /**
   * 지구본이 화면에 보이는지 감시해 자동으로 멈추고 재개합니다.
   * - IntersectionObserver: 스크롤해서 지구본이 화면 밖으로 나갔는지
   * - visibilitychange: 다른 탭으로 이동했는지
   */
  const watchVisibility = (containerEl) => {
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          // 10% 미만만 보이면 사실상 안 보이는 것으로 간주합니다
          if (entry.isIntersecting) resumeRendering('offscreen')
          else pauseRendering('offscreen')
        },
        { threshold: [0, 0.1] },
      )
      intersectionObserver.observe(containerEl)
    }

    visibilityHandler = () => {
      if (document.hidden) pauseRendering('hidden')
      else resumeRendering('hidden')
    }
    document.addEventListener('visibilitychange', visibilityHandler)
  }

  /**
   * 지구본 마운트 초기화
   * @param {HTMLElement} containerEl 지구본이 마운트될 DOM 요소
   * @param {Array} citiesWeather 12개 도시 날씨 데이터
   * @param {Function} onSelectCity 도시 클릭 콜백
   */
  const initGlobe = (containerEl, citiesWeather = [], onSelectCity = () => {}) => {
    if (!containerEl) return

    const width = containerEl.clientWidth || window.innerWidth
    const height = containerEl.clientHeight || window.innerHeight

    // 1. Globe 인스턴스 생성
    globe = Globe({ waitForGlobeReady: false, animateIn: false })(containerEl)
      .backgroundColor('#02040d')
      .showAtmosphere(true)
      .atmosphereColor('#6cb4ff')
      .atmosphereAltitude(0.16)
      .width(width)
      .height(height)

    /*
     * 1-1. 렌더링 해상도(픽셀 비율) 상한 두기
     *
     * 맥북 같은 고해상도(레티나) 화면은 devicePixelRatio 가 2 라서
     * globe.gl 기본값으로는 실제 화면의 **4배 픽셀**을 매 프레임 계산합니다.
     * (1280×800 화면 → 2560×1600 = 410만 픽셀)
     * 1.5 로 제한하면 계산량이 약 45% 줄지만, 눈으로 보이는 차이는 거의 없습니다.
     */
    const renderer = globe.renderer()
    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    }

    // 2. 바다(구체 본체) 색상 및 발광 세팅
    const globeMaterial = globe.globeMaterial()
    globeMaterial.color = new THREE.Color(OCEAN_COLOR)
    globeMaterial.emissive = new THREE.Color('#071a33')
    globeMaterial.emissiveIntensity = 0.9
    globeMaterial.shininess = 6

    // 3. 나라 경계 다각형(Polygon) 그리기
    globe
      .polygonsData(countriesGeoJson.features)
      .polygonCapColor((feat) => {
        const name = feat.properties?.name ?? ''
        return LAND_PALETTE[name.length % LAND_PALETTE.length]
      })
      .polygonSideColor(() => 'rgba(8, 30, 55, 0.65)')
      /*
       * ⚡ 나라 테두리 선(polygonStrokeColor)을 제거했습니다 — 성능 1순위
       *
       * three-globe 는 테두리 색이 지정돼 있으면 나라마다 별도의
       * 선(LineSegments) 객체를 하나씩 더 만듭니다.
       * 우리 지구본은 나라 조각이 285개라, 테두리만으로 **매 프레임 285번의
       * 그리기 명령**이 추가로 나가고 있었습니다. (총 570 → 285로 절반)
       *
       * 대신 나라의 경계는 아래 `polygonAltitude` 로 만들어지는
       * 살짝 솟은 옆면(그림자)이 자연스럽게 구분해 줍니다.
       * 옆면은 윗면과 같은 덩어리라서 그리기 명령이 늘지 않습니다.
       */
      .polygonAltitude(0.012)
      .polygonsTransitionDuration(0)
      .polygonLabel(
        (feat) => `<div class="globe-country-label">${feat.properties?.name ?? ''}</div>`,
      )

    // 4. 초기 카메라 시점 (한반도 중심)
    globe.pointOfView({ lat: 36, lng: 128, altitude: 2.2 })

    // 5. [요구사항 1] 자동으로 지구본 돌아가는 것 막기 (autoRotate = false)
    const controls = globe.controls()
    if (controls) {
      controls.autoRotate = false
      controls.autoRotateSpeed = 0
      controls.enableZoom = true
      controls.minDistance = 130
      controls.maxDistance = 500

      /*
       * [요구사항 3] 확대·축소에 맞춰 지역별 날씨 마커 크기 자동 조정
       *
       * ▶ 왜 필요한가?
       * 지구본을 멀리서 보면(altitude 큼) 12개 도시가 좁은 영역에 몰려
       * 마커끼리 겹쳐 글씨를 읽을 수 없습니다.
       * 반대로 가까이 확대하면(altitude 작음) 마커 사이가 넓어져 여백이 남습니다.
       * → 그래서 **멀수록 작게, 가까울수록 크게** 반비례로 조절합니다.
       *
       * ▶ 왜 rAF로 묶는가?
       * controls의 'change'는 마우스를 드래그하는 동안 1초에 수십~수백 번 발생합니다.
       * 그때마다 스타일을 바꾸면 불필요한 렌더링이 쌓이므로,
       * 다음 화면 갱신 직전에 딱 한 번만 반영하도록 모아서 처리합니다(throttle).
       */
      const applyMarkerScale = () => {
        markerScaleRafId = null
        if (!globe || !containerEl) return

        const pov = globe.pointOfView()
        const alt = pov?.altitude ?? 2.2

        // altitude 0.3(바짝 확대) → 1.45배 / 2.5(전체 보기) → 0.7배
        const scale = Math.max(0.7, Math.min(1.45, 1.6 - alt * 0.36))
        containerEl.style.setProperty('--marker-scale', scale.toFixed(2))

        // 아주 멀리서 볼 때는 이름·기온 라벨을 숨겨 화면이 지저분해지지 않게 합니다
        containerEl.style.setProperty('--marker-label-display', alt > 2.6 ? 'none' : 'block')

        // 🔍 줌 레벨에 따른 랜드마크 팝업 분기용 클래스 토글 (alt < 1.1 일 때 줌인으로 판단)
        containerEl.classList.toggle('globe-zoomed-in', alt < 1.1)

        /*
         * 줌 단계가 바뀐 순간에만 마커 목록을 교체합니다.
         * (매번 교체하면 마커 DOM 을 계속 지웠다 다시 만들어 오히려 느려집니다)
         */
        const nextLod = resolveLod(alt, markerLod)
        if (nextLod !== markerLod) {
          markerLod = nextLod
          globe.htmlElementsData(citiesForLod(markerCities, markerLod))
        }

        // 🏛️ 가까이 내려오면 랜드마크 3D 모형을 지면에 세웁니다
        syncLandmarks(alt)

        // 🛩️ 가까울수록 시선을 눕혀 모형이 서 있는 게 보이도록 합니다
        applyViewShift(alt)
      }

      controlsChangeHandler = () => {
        // 이미 예약돼 있으면 중복 예약하지 않습니다
        if (markerScaleRafId !== null) return
        markerScaleRafId = requestAnimationFrame(applyMarkerScale)
      }

      controls.addEventListener('change', controlsChangeHandler)
      applyMarkerScale() // 초기 1회 적용
    }

    // 6. 별 배경 추가
    const scene = globe.scene()
    if (scene) {
      starField = createStarField(globe.getGlobeRadius() * 12)
      scene.add(starField)
    }

    // 7. 랜드마크 3D 모형 레이어 설정
    globe
      .objectsData([])
      .objectLat((d) => d.lat)
      .objectLng((d) => d.lon)
      .objectAltitude(LANDMARK_ALTITUDE)
      /*
       * objectFacesSurface(true) 는 모형의 +Z 축을 지표면 바깥쪽으로 세웁니다.
       * 덕분에 모형이 화면이 아니라 **자기가 선 땅**을 기준으로 서 있게 되고,
       * 지구본을 돌리면 모형도 같이 기울어집니다. (구글어스와 같은 방식)
       */
      .objectFacesSurface(true)
      .objectThreeObject((d) => getLandmarkModel(d.id))
      .onObjectClick((d) => markerClickHandler(d?.id))

    // 8. 12개 도시 커스텀 HTML 마커 배치
    updateMarkers(citiesWeather, onSelectCity)

    // 9. 리사이즈 대응
    const applySize = () => {
      if (!globe || !containerEl) return
      const w = containerEl.clientWidth || window.innerWidth
      const h = containerEl.clientHeight || window.innerHeight
      globe.width(w)
      globe.height(h)

      // 렌즈 이동량은 화면 크기 기준이라 창이 바뀌면 다시 계산해야 합니다
      applyViewShift(globe.pointOfView()?.altitude ?? 2.2)
    }

    resizeHandler = applySize
    window.addEventListener('resize', resizeHandler)

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(applySize)
      resizeObserver.observe(containerEl)
    }

    // 10. 화면에서 사라지면 렌더링을 멈추도록 감시 시작
    watchVisibility(containerEl)

    // 지구본이 만들어지기 전에 이미 "멈춰야 할 이유"가 쌓여 있었다면 지금 반영합니다
    applyPauseState()
  }

  /**
   * 도시 HTML 마커 갱신
   */
  const updateMarkers = (citiesWeather, onSelectCity) => {
    if (!globe) return

    // 원본을 보관해 두면 줌 단계가 바뀔 때 다시 걸러 쓸 수 있습니다
    markerCities = Array.isArray(citiesWeather) ? citiesWeather : []
    markerClickHandler = onSelectCity ?? (() => {})

    // 아직 단계가 정해지지 않았다면 지금 카메라 높이로 판단합니다
    if (!markerLod) {
      markerLod = resolveLod(globe.pointOfView()?.altitude ?? 2.2, null)
    }

    // 랜드마크 모형이 켜져 있다면 새 도시 목록으로 다시 세웁니다
    if (landmarksVisible) globe.objectsData(citiesWithLandmark())

    globe
      .htmlElementsData(citiesForLod(markerCities, markerLod))
      .htmlLat((d) => d.lat)
      .htmlLng((d) => d.lon)
      .htmlAltitude(0.02)
      .htmlElement((d) => {
        const el = document.createElement('div')
        el.className = 'globe-marker-wrapper'

        const color = groupColors[d.group] || '#38bdf8'
        const temp = Number.isFinite(d.temp) ? Math.round(d.temp) : '--'

        /*
         * 랜드마크는 더 이상 여기서 그리지 않습니다.
         * 예전에는 <img> 를 마커 안에 넣었는데, HTML 마커는 항상 화면을 정면으로
         * 바라보기 때문에 지구본을 돌려도 그림만 제자리라 공중에 떠 보였습니다.
         * 지금은 objects 레이어의 3D 모형이 지면에 직접 서 있고,
         * 이 마커는 그 발밑의 받침대 + 날씨 라벨 역할만 합니다.
         */
        // 모형이 서 있는 도시는 받침대를 얇은 링으로 줄여 모형을 가리지 않게 합니다
        const landmarkClass = hasLandmark(d.id) ? ' has-landmark' : ''

        el.innerHTML = `
          <div class="globe-marker${landmarkClass}" style="--marker-color: ${color};">
            <span class="marker-pulse"></span>
            <span class="marker-dot">${d.icon || '📍'}</span>
            <div class="marker-label">${d.name} ${temp}°</div>
            <div class="marker-tooltip">
              <span class="tooltip-name">${d.name}</span>
              <span class="tooltip-temp">${temp}°</span>
              <span class="tooltip-status">${d.status ?? ''}</span>
            </div>
          </div>
        `

        el.style.cursor = 'pointer'
        el.onclick = (e) => {
          e.stopPropagation()
          markerClickHandler(d.id)
        }

        return el
      })
  }

  /*
   * 카메라를 도시보다 몇 도 남쪽에 세울지 (위의 틸트-시프트 설명 참고).
   *
   * 이 각도가 클수록 더 눕지만, 그만큼 도시가 화면 위로 밀려 올라갑니다.
   * 12° 에서 시선이 지면과 이루는 각이 약 32° 가 되고,
   * 밀려 올라간 만큼은 applyViewShift 가 렌즈를 옮겨 되돌려 줍니다.
   */
  const FLY_TILT_DEG = 32

  /**
   * 지구본 시점 비행 애니메이션
   */
  const flyTo = ({ lat, lng, altitude = 0.45 }, duration = 1800) => {
    if (!globe) return
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    const controls = globe.controls()
    if (controls) {
      controls.autoRotate = false
    }
    // 극지방에서 위도가 넘어가지 않도록 범위를 잘라 둡니다
    const viewLat = Math.max(-85, Math.min(85, lat - FLY_TILT_DEG))
    globe.pointOfView({ lat: viewLat, lng, altitude }, duration)
  }

  /**
   * 초기 시점(한반도 중심)으로 복귀합니다.
   *
   * 이름을 resumeAutoRotate → resetGlobeView 로 바꾼 이유:
   * 이제 지구본은 스스로 돌지 않으므로(자동 회전 사용 안 함)
   * "회전을 재개한다"는 옛 이름이 실제 동작과 맞지 않았습니다.
   */
  const resetGlobeView = () => {
    if (!globe) return
    const controls = globe.controls()
    if (controls) {
      // 혹시 모를 자동 회전을 확실히 꺼 둡니다
      controls.autoRotate = false
      controls.autoRotateSpeed = 0
    }
    globe.pointOfView({ lat: 36, lng: 128, altitude: 2.2 }, 1500)
  }

  /**
   * 구름 레이어 회전 루프 시작
   * (일시정지 중이거나 회전이 필요 없는 레이어면 아무것도 하지 않습니다)
   */
  const startLayerSpin = () => {
    if (!layerSpinEnabled || isPaused || layerAnimId || !layerMesh) return

    const animate = () => {
      if (!layerMesh || isPaused) {
        layerAnimId = null
        return
      }
      layerMesh.rotation.y -= 0.0002
      layerAnimId = requestAnimationFrame(animate)
    }
    animate()
  }

  /** 레이어 Mesh 제거 */
  const removeLayerMesh = () => {
    if (layerAnimId) {
      cancelAnimationFrame(layerAnimId)
      layerAnimId = null
    }
    layerSpinEnabled = false
    if (!layerMesh) return

    layerMesh.parent?.remove(layerMesh)
    layerMesh.geometry?.dispose()
    layerMesh.material?.map?.dispose()
    layerMesh.material?.dispose()
    layerMesh = null
  }

  /**
   * 🛰️ 지구본 위 기상 레이어 전환
   */
  const setWeatherLayer = (layerKey, citiesWeather = []) => {
    if (!globe) return

    removeLayerMesh()

    const config = WEATHER_LAYERS[layerKey]
    if (!config) {
      layerStatus.value = { active: 'none', loading: false, error: null }
      return
    }

    const scene = globe.scene()
    if (!scene) return

    try {
      const canvas = config.draw(citiesWeather)
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace

      const geometry = new THREE.SphereGeometry(globe.getGlobeRadius() * config.altitude, 64, 64)
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: config.opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
      })

      layerMesh = new THREE.Mesh(geometry, material)
      layerMesh.rotation.y = -Math.PI / 2
      scene.add(layerMesh)

      layerSpinEnabled = !!config.spin
      startLayerSpin()

      layerStatus.value = { active: layerKey, loading: false, error: null }
    } catch (err) {
      console.warn(`기상 레이어(${layerKey}) 생성 실패:`, err)
      layerStatus.value = { active: layerKey, loading: false, error: '레이어를 그리지 못했습니다' }
    }
  }

  // 메모리 정리
  const destroyGlobe = () => {
    removeLayerMesh()

    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
      resizeHandler = null
    }
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    // 화면 노출 감시 정리
    if (intersectionObserver) {
      intersectionObserver.disconnect()
      intersectionObserver = null
    }
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
      visibilityHandler = null
    }
    // 확대/축소 감지 핸들러와 예약된 rAF 정리
    if (markerScaleRafId !== null) {
      cancelAnimationFrame(markerScaleRafId)
      markerScaleRafId = null
    }
    if (controlsChangeHandler && globe) {
      globe.controls()?.removeEventListener('change', controlsChangeHandler)
      controlsChangeHandler = null
    }
    if (starField) {
      starField.parent?.remove(starField)
      starField.geometry?.dispose()
      starField.material?.dispose()
      starField = null
    }
    if (globe) {
      try {
        // 렌더 루프를 먼저 멈춰야 이미 정리된 renderer 를 다시 그리지 않습니다
        globe.pauseAnimation()
        globe.htmlElementsData([]).polygonsData([]).objectsData([])
        const renderer = globe.renderer()
        if (renderer) {
          renderer.dispose()
          renderer.forceContextLoss?.()
        }
      } catch (e) {
        console.warn('Globe dispose error:', e)
      }
      globe = null
    }

    // 랜드마크 모형이 쥐고 있던 지오메트리·재질을 반납합니다
    for (const model of landmarkModels.values()) disposeLandmarkModel(model)
    landmarkModels.clear()
    landmarksVisible = false
  }

  onUnmounted(() => {
    destroyGlobe()
  })

  return {
    initGlobe,
    updateMarkers,
    flyTo,
    resetGlobeView,
    setWeatherLayer,
    layerStatus,
    destroyGlobe,
    pauseRendering,
    resumeRendering,
  }
}

// ────────────────────────────────────────────────
// 캔버스 오버레이 그리기 함수 (동일)
// ────────────────────────────────────────────────
const TEX_W = 1024
const TEX_H = 512

const project = (lat, lon) => ({
  x: ((lon + 180) / 360) * TEX_W,
  y: ((90 - lat) / 180) * TEX_H,
})

const px = (valueAt2048) => valueAt2048 * (TEX_W / 2048)

const makeCanvas = () => {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_W
  canvas.height = TEX_H
  return canvas
}

const paintBlob = (ctx, lat, lon, radius, colorRgb, alpha) => {
  const { x, y } = project(lat, lon)

  for (const offsetX of [-TEX_W, 0, TEX_W]) {
    const cx = x + offsetX
    if (cx + radius < 0 || cx - radius > TEX_W) continue

    const gradient = ctx.createRadialGradient(cx, y, 0, cx, y, radius)
    gradient.addColorStop(0, `rgba(${colorRgb},${alpha})`)
    gradient.addColorStop(0.45, `rgba(${colorRgb},${alpha * 0.45})`)
    gradient.addColorStop(1, `rgba(${colorRgb},0)`)

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cx, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

const drawCloudTexture = (citiesWeather = []) => {
  const canvas = makeCanvas()
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, TEX_W, TEX_H)

  for (let i = 0; i < 450; i++) {
    const x = Math.random() * TEX_W
    const y = ((Math.random() + Math.random() + Math.random()) / 3) * TEX_H
    const radius = px(18 + Math.random() * 65)
    const alpha = 0.08 + Math.random() * 0.16

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`)
    gradient.addColorStop(0.55, `rgba(255,255,255,${alpha * 0.4})`)
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  for (const city of citiesWeather) {
    if (!Number.isFinite(city?.lat) || !Number.isFinite(city?.lon)) continue
    const cover = Math.max(0, Math.min(100, Number(city.cloudCover) || 0)) / 100
    if (cover <= 0.05) continue
    paintBlob(ctx, city.lat, city.lon, px(110 + cover * 130), '255,255,255', 0.25 + cover * 0.5)
  }

  return canvas
}

const drawPrecipTexture = (citiesWeather = []) => {
  const canvas = makeCanvas()
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, TEX_W, TEX_H)

  const wetGroups = ['rain', 'snow', 'storm']

  for (const city of citiesWeather) {
    if (!Number.isFinite(city?.lat) || !Number.isFinite(city?.lon)) continue
    const pop = Math.max(0, Math.min(100, Number(city.pop) || 0)) / 100
    const amount = Math.max(0, Number(city.precipitation) || 0)
    const isWet = wetGroups.includes(city.group)

    const strength = Math.min(1, pop * 0.75 + Math.min(0.5, amount / 4) + (isWet ? 0.25 : 0))
    const color =
      city.group === 'snow' ? '224,242,254' : city.group === 'storm' ? '168,85,247' : '56,189,248'

    const radius = px(70 + strength * 190)
    const alpha = 0.12 + strength * 0.7
    paintBlob(ctx, city.lat, city.lon, radius, color, alpha)
  }

  return canvas
}

const tempToColor = (tempC) => {
  const stops = [
    { t: -20, c: [37, 99, 235] },
    { t: 0, c: [56, 189, 248] },
    { t: 12, c: [74, 222, 128] },
    { t: 22, c: [250, 204, 21] },
    { t: 30, c: [249, 115, 22] },
    { t: 40, c: [239, 68, 68] },
  ]

  if (tempC <= stops[0].t) return stops[0].c
  if (tempC >= stops[stops.length - 1].t) return stops[stops.length - 1].c

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (tempC >= a.t && tempC <= b.t) {
      const ratio = (tempC - a.t) / (b.t - a.t)
      return a.c.map((v, k) => Math.round(v + (b.c[k] - v) * ratio))
    }
  }
  return stops[stops.length - 1].c
}

const drawTempTexture = (citiesWeather = []) => {
  const canvas = makeCanvas()
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, TEX_W, TEX_H)

  for (const city of citiesWeather) {
    if (!Number.isFinite(city?.lat) || !Number.isFinite(city?.lon)) continue
    if (!Number.isFinite(city?.temp)) continue

    const [r, g, b] = tempToColor(city.temp)
    paintBlob(ctx, city.lat, city.lon, px(230), `${r},${g},${b}`, 0.8)
  }

  return canvas
}

export const GLOBE_LAYERS = {
  cloud: { key: 'cloud', label: '구름', icon: '☁️' },
  rain: { key: 'rain', label: '강수', icon: '🌧️' },
  temp: { key: 'temp', label: '기온', icon: '🌡️' },
}

const WEATHER_LAYERS = {
  cloud: { altitude: 1.02, opacity: 0.55, spin: true, draw: drawCloudTexture },
  rain: { altitude: 1.025, opacity: 0.85, spin: false, draw: drawPrecipTexture },
  temp: { altitude: 1.022, opacity: 0.75, spin: false, draw: drawTempTexture },
}
