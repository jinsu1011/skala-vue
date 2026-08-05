<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { buildLandmarkModel, disposeLandmarkModel } from '@/three/landmarkModels'

/**
 * 🏛️ 랜드마크 3D 모형 미리보기
 *
 * 지구본에 세우는 것과 **똑같은 모형**을 작은 캔버스에서 천천히 돌려 보여 줍니다.
 * 예전에는 여기에 정사각형 이미지를 넣었는데, 그림 파일에 투명 배경 대신
 * 체크무늬가 그대로 구워져 있어서 카드 안에 격자가 비쳤습니다.
 * 모형을 직접 그리면 그 문제도 없고, 지구본에서 본 모습과 항상 일치합니다.
 */
const props = defineProps({
  /** landmarkModels 의 모형 키 */
  model: { type: String, required: true },
  /** 캔버스 한 변의 크기(px) */
  size: { type: Number, default: 76 },
})

const canvasEl = ref(null)

let renderer = null
let scene = null
let camera = null
let currentModel = null
let rafId = null

/** 모형 크기에 맞춰 카메라를 뒤로 물려, 어떤 모형이든 꽉 차게 담습니다 */
const frameModel = (object) => {
  const bounds = new THREE.Box3().setFromObject(object)
  const size = bounds.getSize(new THREE.Vector3())
  const center = bounds.getCenter(new THREE.Vector3())

  // 모형의 한가운데가 원점에 오도록 옮기면 회전축이 흔들리지 않습니다
  object.position.sub(center)

  const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1
  const distance = (radius / Math.tan((camera.fov * Math.PI) / 360)) * 1.35

  camera.position.set(distance * 0.45, distance * 0.42, distance * 0.85)
  camera.lookAt(0, 0, 0)
  camera.near = distance * 0.05
  camera.far = distance * 4
  camera.updateProjectionMatrix()
}

const loadModel = (modelKey) => {
  if (!scene) return

  if (currentModel) {
    scene.remove(currentModel)
    disposeLandmarkModel(currentModel)
    currentModel = null
  }

  // upright: 지구본과 달리 여기서는 Y축이 그대로 하늘 방향입니다
  const object = buildLandmarkModel(modelKey, { upright: true })
  if (!object) return

  scene.add(object)
  frameModel(object)
  currentModel = object
}

onMounted(() => {
  if (!canvasEl.value) return

  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl.value,
    alpha: true, // 카드 배경이 비쳐 보이도록
    antialias: true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(props.size, props.size, false)

  scene = new THREE.Scene()
  scene.add(new THREE.AmbientLight(0xffffff, 2.1))

  const keyLight = new THREE.DirectionalLight(0xfff2dd, 2.6)
  keyLight.position.set(4, 6, 5)
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0x9fd2ff, 1.1)
  fillLight.position.set(-5, 2, -4)
  scene.add(fillLight)

  camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)

  loadModel(props.model)

  const tick = () => {
    rafId = requestAnimationFrame(tick)
    if (currentModel) currentModel.rotation.y += 0.005
    renderer.render(scene, camera)
  }
  tick()
})

watch(
  () => props.model,
  (key) => loadModel(key),
)

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = null

  if (currentModel) {
    scene?.remove(currentModel)
    disposeLandmarkModel(currentModel)
    currentModel = null
  }

  renderer?.dispose()
  renderer?.forceContextLoss?.()
  renderer = null
  scene = null
  camera = null
})
</script>

<template>
  <canvas
    ref="canvasEl"
    class="landmark-model-3d"
    :style="{ width: `${size}px`, height: `${size}px` }"
  />
</template>

<style scoped>
.landmark-model-3d {
  display: block;
  flex: none;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35));
}
</style>
