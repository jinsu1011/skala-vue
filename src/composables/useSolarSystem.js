import { ref, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PLANET_LIST } from '@/data/planetData'

/**
 * 🪐 useSolarSystem Composable — 3D 태양계 씬
 *
 * ─ 클릭 감지 핵심 원리 ─
 * OrbitControls 는 마우스 드래그로 카메라를 회전시킨다.
 * 문제는 "클릭"도 mousedown → mouseup 이므로, 드래그와 클릭을 구분해야 한다.
 * → mousedown 좌표와 mouseup 좌표의 차이가 5px 이내이면 "클릭"으로 판정한다.
 */
export function useSolarSystem() {
  let scene = null
  let camera = null
  let renderer = null
  let controls = null
  let animFrameId = null
  let resizeHandler = null

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  const planetMeshes = []
  const labelCoords = ref([])
  const hoveredPlanet = ref(null)
  const selectedPlanet = ref(null) // 클릭하여 선택된 행성 데이터
  let onEarthClickCallback = null

  // ── 선택된 행성 강조 효과 ──
  let prevSelectedId = null
  const highlightSelected = (planetId) => {
    // 이전 강조 해제
    planetMeshes.forEach((item) => {
      item.mesh.scale.set(1, 1, 1)
      if (item.data.emissive) return
      item.mesh.material.emissiveIntensity = 0.15
    })

    // 새로 선택된 행성 강조
    if (planetId) {
      const target = planetMeshes.find((p) => p.data.id === planetId)
      if (target) {
        target.mesh.scale.set(1.3, 1.3, 1.3)
        if (!target.data.emissive) {
          target.mesh.material.emissiveIntensity = 0.6
        }
      }
    }
    prevSelectedId = planetId
  }

  // ID로 행성 직접 선택 (라벨 클릭용)
  const selectPlanetById = (id) => {
    const planet = planetMeshes.find((p) => p.data.id === id)
    if (!planet) return

    if (planet.data.isEarth) {
      if (onEarthClickCallback) onEarthClickCallback()
    } else {
      if (selectedPlanet.value && selectedPlanet.value.id === id) {
        selectedPlanet.value = null
        highlightSelected(null)
      } else {
        selectedPlanet.value = planet.data
        highlightSelected(id)
      }
    }
  }

  const initSolarSystem = (container, onEarthClick) => {
    if (!container) return
    onEarthClickCallback = onEarthClick

    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020617)

    // Camera
    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(0, 45, 85)
    camera.lookAt(0, 0, 0)

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    // OrbitControls
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.maxDistance = 180
    controls.minDistance = 15
    controls.maxPolarAngle = Math.PI * 0.85
    controls.minPolarAngle = Math.PI * 0.1

    // 조명
    scene.add(new THREE.AmbientLight(0xffffff, 0.45))
    const sunLight = new THREE.PointLight(0xffffff, 2.0, 300)
    sunLight.position.set(0, 0, 0)
    scene.add(sunLight)

    // ── 6. 별 배경 (StarField) ──
    const starGeo = new THREE.BufferGeometry()
    const starCount = 800
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
        new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true, opacity: 0.5 }),
      ),
    )

    // 행성 생성
    PLANET_LIST.forEach((data) => {
      const geometry = new THREE.SphereGeometry(data.visualRadius, 48, 48)
      let material

      if (data.emissive) {
        material = new THREE.MeshBasicMaterial({ color: data.color })
      } else {
        material = new THREE.MeshStandardMaterial({
          color: data.color,
          roughness: 0.45,
          metalness: 0.25,
          emissiveIntensity: 0.15,
          emissive: data.color,
        })
      }

      const mesh = new THREE.Mesh(geometry, material)
      const startAngle = Math.random() * Math.PI * 2

      if (data.orbitRadius > 0) {
        mesh.position.x = Math.cos(startAngle) * data.orbitRadius
        mesh.position.z = Math.sin(startAngle) * data.orbitRadius
      }

      scene.add(mesh)

      // 태양 glow
      if (data.emissive) {
        const glowGeo = new THREE.SphereGeometry(data.visualRadius * 1.4, 32, 32)
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0xff8c00,
          transparent: true,
          opacity: 0.15,
        })
        mesh.add(new THREE.Mesh(glowGeo, glowMat))
      }

      // 토성 고리
      if (data.hasRing) {
        const ringGeo = new THREE.RingGeometry(data.visualRadius * 1.5, data.visualRadius * 2.4, 64)
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

      // 궤도 링
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
        scene.add(
          new THREE.Line(
            orbitGeo,
            new THREE.LineBasicMaterial({ color: 0x6699cc, transparent: true, opacity: 0.35 }),
          ),
        )
      }

      planetMeshes.push({ mesh, data, angle: startAngle })
    })

    // ── 히트 테스트: Raycaster 로 감지된 오브젝트 → 행성 찾기 ──
    // 자식 Mesh (태양 glow, 토성 고리 등)를 클릭해도 부모 행성을 찾아준다.
    const findPlanetFromHit = (hitObject) => {
      for (const item of planetMeshes) {
        if (item.mesh === hitObject || item.mesh === hitObject.parent) {
          return item
        }
      }
      return null
    }

    // ── 클릭 감지 (안정화) ──
    // 포인터 이벤트로 마우스 + 터치 통합 처리
    // 조건: 이동 거리 10px 이내 AND 누른 시간 500ms 이내 → "클릭"
    let pointerDownX = 0
    let pointerDownY = 0
    let pointerDownTime = 0

    const onPointerDown = (event) => {
      pointerDownX = event.clientX
      pointerDownY = event.clientY
      pointerDownTime = Date.now()
    }

    const onPointerUp = (event) => {
      const dx = event.clientX - pointerDownX
      const dy = event.clientY - pointerDownY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const elapsed = Date.now() - pointerDownTime

      // 10px 넘게 움직였거나 500ms 넘게 누르고 있었으면 드래그 → 무시
      if (dist > 10 || elapsed > 500) return

      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const allMeshes = planetMeshes.map((p) => p.mesh)
      const intersects = raycaster.intersectObjects(allMeshes, true)

      if (intersects.length > 0) {
        const planet = findPlanetFromHit(intersects[0].object)
        if (planet) {
          if (planet.data.isEarth && onEarthClick) {
            onEarthClick()
          } else {
            if (selectedPlanet.value && selectedPlanet.value.id === planet.data.id) {
              selectedPlanet.value = null
              highlightSelected(null)
            } else {
              selectedPlanet.value = planet.data
              highlightSelected(planet.data.id)
            }
          }
        }
      } else {
        selectedPlanet.value = null
        highlightSelected(null)
      }
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)

    // 마우스 호버 → 커서 + 살짝 확대
    const handleMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const allMeshes = planetMeshes.map((p) => p.mesh)
      const intersects = raycaster.intersectObjects(allMeshes, true)

      if (intersects.length > 0) {
        renderer.domElement.style.cursor = 'pointer'
        const planet = findPlanetFromHit(intersects[0].object)
        hoveredPlanet.value = planet ? planet.data.id : null
      } else {
        renderer.domElement.style.cursor = 'grab'
        hoveredPlanet.value = null
      }
    }
    renderer.domElement.addEventListener('mousemove', handleMouseMove)

    // 애니메이션 루프
    const tempVec = new THREE.Vector3()
    let currentWidth = width
    let currentHeight = height

    const animate = () => {
      animFrameId = requestAnimationFrame(animate)
      controls.update()

      // 선택 상태 동기화
      const curSelId = selectedPlanet.value ? selectedPlanet.value.id : null
      if (curSelId !== prevSelectedId) {
        highlightSelected(curSelId)
      }

      const coords = []

      planetMeshes.forEach((item) => {
        item.mesh.rotation.y += item.data.spinSpeed
        if (item.data.orbitRadius > 0) {
          item.angle += item.data.orbitSpeed * 0.25
          item.mesh.position.x = Math.cos(item.angle) * item.data.orbitRadius
          item.mesh.position.z = Math.sin(item.angle) * item.data.orbitRadius
        }

        item.mesh.getWorldPosition(tempVec)
        tempVec.y += item.data.visualRadius + 1.5
        tempVec.project(camera)

        coords.push({
          id: item.data.id,
          name: item.data.name,
          temp: item.data.surfaceTemp,
          color: item.data.colorHex,
          x: (tempVec.x * 0.5 + 0.5) * currentWidth,
          y: (-(tempVec.y * 0.5) + 0.5) * currentHeight,
          visible: tempVec.z < 1,
        })
      })

      labelCoords.value = coords
      renderer.render(scene, camera)
    }
    animate()

    // 리사이즈
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

  onUnmounted(cleanup)

  return { initSolarSystem, cleanup, labelCoords, hoveredPlanet, selectedPlanet, selectPlanetById }
}
