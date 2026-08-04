import { ref, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PLANET_LIST } from '@/data/planetData'

/**
 * 🪐 useSolarSystem Composable — 3D 태양계 씬
 *
 * Three.js 로 태양 + 8대 행성이 공전하는 3D 태양계를 만든다.
 * 비유: 천체 모형관(천문대)의 오래리(orrery, 태양계 모형 장치)를 코드로 재현한 것.
 *
 * - Raycaster 로 행성 클릭 감지
 * - 3D 좌표 → 2D 화면 좌표로 투영하여 HTML 라벨 오버레이
 * - OrbitControls 로 드래그 회전 및 줌
 */
export function useSolarSystem() {
  let scene = null
  let camera = null
  let renderer = null
  let controls = null
  let animFrameId = null
  let resizeHandler = null

  // Raycaster: 마우스 클릭 시 3D 공간의 어떤 행성에 닿았는지 계산하는 도구
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  // 행성 Mesh 리스트 (클릭 감지 및 애니메이션용)
  const planetMeshes = []

  // 2D 화면에 띄울 행성 라벨 좌표 (Vue 반응형)
  const labelCoords = ref([])

  // 현재 마우스 호버 중인 행성 id
  const hoveredPlanet = ref(null)

  /**
   * 3D 태양계 씬 초기화
   * @param {HTMLElement} container - canvas 를 붙일 DOM 요소
   * @param {Function} onPlanetClick - 행성 클릭 시 콜백 (planetData 전달)
   */
  const initSolarSystem = (container, onPlanetClick) => {
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    // ── 1. Scene (무대) ──
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020617)

    // ── 2. Camera (카메라) ──
    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(0, 45, 85)
    camera.lookAt(0, 0, 0)

    // ── 3. Renderer (렌더러) ──
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    // ── 4. OrbitControls (마우스 조작) ──
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.maxDistance = 180
    controls.minDistance = 15
    controls.maxPolarAngle = Math.PI * 0.85
    controls.minPolarAngle = Math.PI * 0.1

    // ── 5. 조명 ──
    // 우주 배경 조명 (약하게)
    scene.add(new THREE.AmbientLight(0xffffff, 0.25))
    // 태양 빛 (중앙에서 방사)
    const sunLight = new THREE.PointLight(0xffffff, 2.0, 300)
    sunLight.position.set(0, 0, 0)
    scene.add(sunLight)

    // ── 6. 별 배경 (StarField) ──
    const starGeo = new THREE.BufferGeometry()
    const starCount = 4000
    const starPositions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 500
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 500
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 500
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    scene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.75 }),
      ),
    )

    // ── 7. 행성 생성 ──
    PLANET_LIST.forEach((data) => {
      // 행성 구체 Mesh
      const geometry = new THREE.SphereGeometry(data.visualRadius, 48, 48)
      let material

      if (data.emissive) {
        // 태양: 자체 발광 (MeshBasicMaterial 은 조명 영향을 안 받음)
        material = new THREE.MeshBasicMaterial({ color: data.color })
      } else {
        // 행성: 조명을 받아 입체감이 드러남 (MeshStandardMaterial)
        material = new THREE.MeshStandardMaterial({
          color: data.color,
          roughness: 0.65,
          metalness: 0.15,
        })
      }

      const mesh = new THREE.Mesh(geometry, material)

      // 태양은 중앙(0,0,0), 나머지는 궤도 시작 위치에 배치
      const startAngle = Math.random() * Math.PI * 2
      if (data.orbitRadius > 0) {
        mesh.position.x = Math.cos(startAngle) * data.orbitRadius
        mesh.position.z = Math.sin(startAngle) * data.orbitRadius
      }

      scene.add(mesh)

      // 태양 glow 이펙트 (반투명 확대 구체)
      if (data.emissive) {
        const glowGeo = new THREE.SphereGeometry(data.visualRadius * 1.4, 32, 32)
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0xff8c00,
          transparent: true,
          opacity: 0.15,
        })
        const glowMesh = new THREE.Mesh(glowGeo, glowMat)
        mesh.add(glowMesh)
      }

      // 토성: 3D 얼음 고리
      if (data.hasRing) {
        const ringGeo = new THREE.RingGeometry(
          data.visualRadius * 1.5,
          data.visualRadius * 2.4,
          64,
        )
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xfde68a,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.55,
        })
        const ringMesh = new THREE.Mesh(ringGeo, ringMat)
        ringMesh.rotation.x = Math.PI / 2.2
        mesh.add(ringMesh)
      }

      // 궤도 링 선 (태양 제외)
      if (data.orbitRadius > 0) {
        const orbitPoints = []
        for (let i = 0; i <= 128; i++) {
          const theta = (i / 128) * Math.PI * 2
          orbitPoints.push(
            new THREE.Vector3(
              Math.cos(theta) * data.orbitRadius,
              0,
              Math.sin(theta) * data.orbitRadius,
            ),
          )
        }
        const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints)
        const orbitLine = new THREE.Line(
          orbitGeo,
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 }),
        )
        scene.add(orbitLine)
      }

      planetMeshes.push({
        mesh,
        data,
        angle: startAngle,
      })
    })

    // ── 8. 마우스 클릭 → Raycaster 로 행성 감지 ──
    const handleClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const meshList = planetMeshes.map((p) => p.mesh)
      const intersects = raycaster.intersectObjects(meshList)

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object
        const planet = planetMeshes.find((p) => p.mesh === hitMesh)
        if (planet && onPlanetClick) {
          onPlanetClick(planet.data)
        }
      }
    }
    renderer.domElement.addEventListener('click', handleClick)

    // 마우스 호버 → 커서 변경
    const handleMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const meshList = planetMeshes.map((p) => p.mesh)
      const intersects = raycaster.intersectObjects(meshList)

      if (intersects.length > 0) {
        renderer.domElement.style.cursor = 'pointer'
        const planet = planetMeshes.find((p) => p.mesh === intersects[0].object)
        hoveredPlanet.value = planet ? planet.data.id : null
      } else {
        renderer.domElement.style.cursor = 'grab'
        hoveredPlanet.value = null
      }
    }
    renderer.domElement.addEventListener('mousemove', handleMouseMove)

    // ── 9. 애니메이션 루프 ──
    const tempVec = new THREE.Vector3()
    let currentWidth = width
    let currentHeight = height

    const animate = () => {
      animFrameId = requestAnimationFrame(animate)
      controls.update()

      const coords = []

      planetMeshes.forEach((item) => {
        // 자전
        item.mesh.rotation.y += item.data.spinSpeed

        // 공전 (태양 제외)
        if (item.data.orbitRadius > 0) {
          item.angle += item.data.orbitSpeed * 0.25
          item.mesh.position.x = Math.cos(item.angle) * item.data.orbitRadius
          item.mesh.position.z = Math.sin(item.angle) * item.data.orbitRadius
        }

        // 3D 위치 → 2D 화면 좌표 투영 (라벨 표시용)
        item.mesh.getWorldPosition(tempVec)
        tempVec.y += item.data.visualRadius + 1.5
        tempVec.project(camera)

        const screenX = (tempVec.x * 0.5 + 0.5) * currentWidth
        const screenY = (-(tempVec.y * 0.5) + 0.5) * currentHeight

        coords.push({
          id: item.data.id,
          name: item.data.name,
          temp: item.data.surfaceTemp,
          color: item.data.colorHex,
          x: screenX,
          y: screenY,
          visible: tempVec.z < 1, // 카메라 뒤에 있으면 숨김
        })
      })

      labelCoords.value = coords
      renderer.render(scene, camera)
    }
    animate()

    // ── 10. 리사이즈 대응 ──
    resizeHandler = () => {
      if (!container || !renderer || !camera) return
      currentWidth = container.clientWidth
      currentHeight = container.clientHeight
      camera.aspect = currentWidth / currentHeight
      camera.updateProjectionMatrix()
      renderer.setSize(currentWidth, currentHeight)
    }
    window.addEventListener('resize', resizeHandler)
  }

  /**
   * 3D 씬 메모리 정리 (WebGL 컨텍스트 해제)
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
    planetMeshes.length = 0
    scene = null
    camera = null
    renderer = null
    controls = null
  }

  // 컴포넌트가 파괴될 때 자동 정리
  onUnmounted(cleanup)

  return {
    initSolarSystem,
    cleanup,
    labelCoords,
    hoveredPlanet,
  }
}
