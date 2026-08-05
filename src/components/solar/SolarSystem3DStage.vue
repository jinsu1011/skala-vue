<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const containerRef = ref(null)
const showAllTemps = ref(true) // 기본적으로 전체 온도 한 번에 표시

// 태양계 3D 천체 데이터 (색상, 크기, 궤도 반지름, 표면 온도)
const PLANET_DATA = [
  {
    name: '태양 (Sun)',
    temp: '5,500 °C',
    color: 0xff4500,
    radius: 4.5,
    dist: 0,
    speed: 0,
    desc: '태양계 중심 항성',
  },
  {
    name: '수성 (Mercury)',
    temp: '-180 ~ 430 °C',
    color: 0xa1a1aa,
    radius: 0.8,
    dist: 9,
    speed: 0.03,
    desc: '대기 없음, 극심한 일교차',
  },
  {
    name: '금성 (Venus)',
    temp: '약 464 °C',
    color: 0xeab308,
    radius: 1.4,
    dist: 14,
    speed: 0.02,
    desc: '온실효과로 가장 뜨거운 행성',
  },
  {
    name: '지구 (Earth)',
    temp: '평균 15 °C',
    color: 0x38bdf8,
    radius: 1.5,
    dist: 20,
    speed: 0.015,
    desc: '생명체 서식 최적 온도',
  },
  {
    name: '화성 (Mars)',
    temp: '-140 ~ 20 °C',
    color: 0xf97316,
    radius: 1.1,
    dist: 26,
    speed: 0.012,
    desc: '춥고 건조한 붉은 행성',
  },
  {
    name: '목성 (Jupiter)',
    temp: '약 -110 °C',
    color: 0xd97706,
    radius: 3.2,
    dist: 35,
    speed: 0.008,
    desc: '거대 가스 행성',
  },
  {
    name: '토성 (Saturn)',
    temp: '약 -140 °C',
    color: 0xfde047,
    radius: 2.7,
    dist: 46,
    speed: 0.006,
    ring: true,
    desc: '아름다운 얼음 고리 행성',
  },
  {
    name: '천왕성 (Uranus)',
    temp: '약 -195 °C',
    color: 0x22d3ee,
    radius: 2.1,
    dist: 56,
    speed: 0.004,
    desc: '가장 추운 청록색 얼음 거인',
  },
  {
    name: '해왕성 (Neptune)',
    temp: '약 -200 °C',
    color: 0x3b82f6,
    radius: 2.0,
    dist: 66,
    speed: 0.003,
    desc: '극한 추위의 푸른 행성',
  },
]

let scene = null
let camera = null
let renderer = null
let controls = null
let animFrameId = null
const planetMeshes = []
const planetScreenCoords = ref([])

// Three.js 3D 태양계 씬 마운트
const initSolarScene = () => {
  if (!containerRef.value) return

  const width = containerRef.value.clientWidth || window.innerWidth
  const height = containerRef.value.clientHeight || window.innerHeight

  // 1. Scene 생성
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x02040d)

  // 2. Camera 생성
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.set(0, 35, 75)

  // 3. Renderer 생성
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  containerRef.value.appendChild(renderer.domElement)

  // 4. OrbitControls 마우스 드래그 조작
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.maxDistance = 150
  controls.minDistance = 15

  // 5. 조명 (태양 빛 + 우주 조명)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)

  const sunLight = new THREE.PointLight(0xffffff, 2.5, 300)
  sunLight.position.set(0, 0, 0)
  scene.add(sunLight)

  // 6. 별 배경 (StarField)
  const starGeo = new THREE.BufferGeometry()
  const starCount = 3000
  const starPos = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 400
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 400
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 400
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.2,
    transparent: true,
    opacity: 0.8,
  })
  const starField = new THREE.Points(starGeo, starMat)
  scene.add(starField)

  // 7. 3D 태양 및 8개 행성 생성
  PLANET_DATA.forEach((data, index) => {
    // 3D 구체 매시
    const geo = new THREE.SphereGeometry(data.radius, 32, 32)
    let mat
    if (index === 0) {
      // 태양 자체 발광
      mat = new THREE.MeshBasicMaterial({ color: data.color })
    } else {
      mat = new THREE.MeshStandardMaterial({
        color: data.color,
        roughness: 0.7,
        metalness: 0.2,
      })
    }

    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.x = data.dist
    scene.add(mesh)

    // 토성 고리 추가
    if (data.ring) {
      const ringGeo = new THREE.RingGeometry(data.radius * 1.4, data.radius * 2.2, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfde047,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.rotation.x = Math.PI / 2.5
      mesh.add(ringMesh)
    }

    // 궤도 링 선 그리기 (태양 제외)
    if (data.dist > 0) {
      const orbitGeo = new THREE.BufferGeometry()
      const points = []
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2
        points.push(new THREE.Vector3(Math.cos(theta) * data.dist, 0, Math.sin(theta) * data.dist))
      }
      orbitGeo.setFromPoints(points)
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
      })
      const orbitLine = new THREE.Line(orbitGeo, orbitMat)
      scene.add(orbitLine)
    }

    planetMeshes.push({
      mesh,
      data,
      angle: Math.random() * Math.PI * 2,
    })
  })

  // 8. 3D 프레임 애니메이션 및 2D HTML 표면온도 핀 좌표 투영
  const animate = () => {
    animFrameId = requestAnimationFrame(animate)
    controls.update()

    const screenCoords = []

    planetMeshes.forEach((item) => {
      // 행성 자전 및 공전
      item.mesh.rotation.y += 0.01
      if (item.data.dist > 0) {
        item.angle += item.data.speed * 0.3
        item.mesh.position.x = Math.cos(item.angle) * item.data.dist
        item.mesh.position.z = Math.sin(item.angle) * item.data.dist
      }

      // 3D 위치를 2D 화면 픽셀 좌표로 변환 (표면 온도 라벨 표시용)
      const tempVec = new THREE.Vector3()
      item.mesh.getWorldPosition(tempVec)
      tempVec.y += item.data.radius + 1.2
      tempVec.project(camera)

      const x = (tempVec.x * 0.5 + 0.5) * width
      const y = (-(tempVec.y * 0.5) + 0.5) * height

      screenCoords.push({
        name: item.data.name,
        temp: item.data.temp,
        color: `#${item.data.color.toString(16).padStart(6, '0')}`,
        desc: item.data.desc,
        x,
        y,
        visible: tempVec.z < 1,
      })
    })

    planetScreenCoords.value = screenCoords
    renderer.render(scene, camera)
  }

  animate()

  // 리사이즈 대응
  const handleResize = () => {
    if (!containerRef.value || !renderer || !camera) return
    const w = containerRef.value.clientWidth
    const h = containerRef.value.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  window.addEventListener('resize', handleResize)
}

const cleanupSolarScene = () => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss?.()
  }
  scene = null
  camera = null
  renderer = null
  controls = null
}

onMounted(() => {
  initSolarScene()
})

onUnmounted(() => {
  cleanupSolarScene()
})
</script>

<template>
  <Transition name="solar-stage-fade">
    <div v-if="isOpen" class="solar-3d-stage-wrapper">
      <!-- 3D Canvas 컨테이너 -->
      <div ref="containerRef" class="solar-canvas-container"></div>

      <!-- 상단 컨트롤 헤더 -->
      <div class="solar-3d-topbar">
        <div class="topbar-title">
          <span class="sun-icon">☀️</span>
          <div>
            <h3>3D 태양계 표면온도 그래픽 뷰</h3>
            <p>드래그하여 3D 태양계를 회전하고 각 행성의 표면 온도를 확인해보세요</p>
          </div>
        </div>

        <div class="topbar-actions">
          <button
            class="toggle-temp-btn"
            :class="{ active: showAllTemps }"
            @click="showAllTemps = !showAllTemps"
          >
            🌡️ {{ showAllTemps ? '온도 숨기기' : '온도 전체 보기' }}
          </button>
          <button class="close-stage-btn" @click="emit('close')">✕ 닫기</button>
        </div>
      </div>

      <!-- 3D 공간 상에 투영되는 표면 온도 핀/라벨 (클릭 한 번으로 전체 온도 동시 표시) -->
      <div v-if="showAllTemps" class="solar-temp-labels-overlay">
        <div
          v-for="(item, idx) in planetScreenCoords"
          :key="idx"
          class="solar-3d-temp-pin"
          :style="{
            left: `${item.x}px`,
            top: `${item.y}px`,
            opacity: item.visible ? 1 : 0,
          }"
        >
          <div class="pin-box" :style="{ borderColor: item.color }">
            <span class="pin-name">{{ item.name.split(' ')[0] }}</span>
            <span class="pin-temp" :style="{ color: item.color }">{{ item.temp }}</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.solar-3d-stage-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #02040d;
  z-index: 3000;
  overflow: hidden;
}

.solar-canvas-container {
  width: 100%;
  height: 100%;
}

.solar-3d-topbar {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  color: #fff;
  z-index: 3100;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
}

.topbar-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sun-icon {
  font-size: 28px;
}

.topbar-title h3 {
  font-size: 17px;
  font-weight: 700;
  background: linear-gradient(135deg, #fde047, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.topbar-title p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-temp-btn {
  padding: 8px 16px;
  background: rgba(250, 204, 21, 0.15);
  border: 1px solid rgba(250, 204, 21, 0.4);
  border-radius: 16px;
  color: #fde047;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-temp-btn:hover,
.toggle-temp-btn.active {
  background: rgba(250, 204, 21, 0.3);
  border-color: #fde047;
}

.close-stage-btn {
  padding: 8px 16px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 16px;
  color: #fca5a5;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-stage-btn:hover {
  background: rgba(239, 68, 68, 0.4);
  color: #fff;
}

/* 3D 공간 투영 표면 온도 핀 라벨 */
.solar-temp-labels-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3050;
}

.solar-3d-temp-pin {
  position: absolute;
  transform: translate(-50%, -100%);
  transition: opacity 0.15s ease;
}

.pin-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 10px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(10px);
  border: 1.5px solid #facc15;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

.pin-name {
  font-size: 11px;
  font-weight: 600;
  color: #e2e8f0;
}

.pin-temp {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: -0.3px;
}

.solar-stage-fade-enter-active,
.solar-stage-fade-leave-active {
  transition: opacity 0.4s ease;
}

.solar-stage-fade-enter-from,
.solar-stage-fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .topbar-title p {
    display: none;
  }
}
</style>
