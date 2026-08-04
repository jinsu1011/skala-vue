import { onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * 🪐 usePlanetGlobe Composable — 개별 행성 3D 구체 렌더링
 *
 * 하나의 행성을 전체 화면으로 크게 보여주는 3D 뷰.
 * 사용자가 마우스 드래그로 행성을 360° 회전하고 줌인/아웃할 수 있다.
 *
 * 비유: 기존 지구본(useGlobe.js)과 같은 UX 이지만,
 *       지구 대신 화성, 목성 등 다른 행성을 보여주는 버전.
 */
export function usePlanetGlobe() {
  let scene = null
  let camera = null
  let renderer = null
  let controls = null
  let animFrameId = null
  let resizeHandler = null
  let planetMesh = null

  /**
   * 개별 행성 3D 씬 초기화
   * @param {HTMLElement} container - canvas 를 붙일 DOM 요소
   * @param {Object} planetData   - planetData.js 의 행성 데이터 객체
   */
  const initPlanetGlobe = (container, planetData) => {
    if (!container || !planetData) return

    const width = container.clientWidth
    const height = container.clientHeight

    // ── 1. Scene ──
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020617)

    // ── 2. Camera ──
    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 500)
    camera.position.set(0, 2, 8)

    // ── 3. Renderer ──
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    // ── 4. OrbitControls ──
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.maxDistance = 20
    controls.minDistance = 4
    controls.autoRotate = true
    controls.autoRotateSpeed = 1.2

    // ── 5. 조명 ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.35))

    // 태양 빛 (한쪽에서 비추어 행성 반구에 명암 생기게)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8)
    dirLight.position.set(5, 3, 5)
    scene.add(dirLight)

    // 반대쪽 보조광 (완전 어두운 면 방지)
    const fillLight = new THREE.DirectionalLight(0x4488cc, 0.3)
    fillLight.position.set(-5, -2, -5)
    scene.add(fillLight)

    // ── 6. 별 배경 ──
    const starGeo = new THREE.BufferGeometry()
    const starPositions = new Float32Array(2000 * 3)
    for (let i = 0; i < 2000; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 300
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 300
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 300
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    scene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, transparent: true, opacity: 0.7 }),
      ),
    )

    // ── 7. 행성 구체 생성 ──
    const radius = 3
    const geometry = new THREE.SphereGeometry(radius, 64, 64)
    let material

    if (planetData.emissive) {
      // 태양: 자체 발광
      material = new THREE.MeshBasicMaterial({ color: planetData.color })
      // 글로우 이펙트
      const glowGeo = new THREE.SphereGeometry(radius * 1.3, 32, 32)
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff8c00,
        transparent: true,
        opacity: 0.12,
      })
      scene.add(new THREE.Mesh(glowGeo, glowMat))
    } else {
      // 일반 행성: 조명을 받아 입체감
      material = new THREE.MeshStandardMaterial({
        color: planetData.color,
        roughness: 0.6,
        metalness: 0.1,
      })
    }

    planetMesh = new THREE.Mesh(geometry, material)
    scene.add(planetMesh)

    // 토성: 3D 고리
    if (planetData.hasRing) {
      const ringGeo = new THREE.RingGeometry(radius * 1.5, radius * 2.5, 64)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfde68a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.rotation.x = Math.PI / 2.2
      planetMesh.add(ringMesh)
    }

    // ── 8. 애니메이션 루프 ──
    const animate = () => {
      animFrameId = requestAnimationFrame(animate)
      controls.update()
      if (planetMesh) {
        planetMesh.rotation.y += planetData.spinSpeed || 0.005
      }
      renderer.render(scene, camera)
    }
    animate()

    // ── 9. 리사이즈 ──
    resizeHandler = () => {
      if (!container || !renderer || !camera) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', resizeHandler)
  }

  /**
   * 메모리 정리
   */
  const cleanup = () => {
    if (animFrameId) cancelAnimationFrame(animFrameId)
    if (resizeHandler) window.removeEventListener('resize', resizeHandler)
    if (renderer) {
      renderer.dispose()
      renderer.forceContextLoss?.()
      if (renderer.domElement?.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
    scene = null
    camera = null
    renderer = null
    controls = null
    planetMesh = null
  }

  onUnmounted(cleanup)

  return { initPlanetGlobe, cleanup }
}
