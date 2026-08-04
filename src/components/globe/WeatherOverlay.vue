<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useWeatherEffect } from '@/composables/useWeatherEffect'

const props = defineProps({
  group: {
    type: String,
    default: 'clear',
  },
  precipitation: {
    type: Number,
    default: 0,
  },
  isDay: {
    type: Boolean,
    default: true,
  },
})

const canvasRef = ref(null)
const { startEffect, stopEffect } = useWeatherEffect()

/*
 * 캔버스는 width/height 를 바꾸는 순간 내용이 깨끗이 지워집니다.
 * 비·눈처럼 매 프레임 다시 그리는 효과는 다음 프레임에 저절로 복구되지만,
 * '맑은 낮의 햇살'은 한 번만 그리는 정적인 그림이라 스스로 돌아오지 못합니다.
 * → 크기가 바뀌면 효과를 통째로 다시 시작해 줍니다.
 */
let resizeTimer = null

const handleResize = () => {
  // 창을 드래그하는 동안 resize 는 1초에 수십 번 발생합니다.
  // 그때마다 파티클 수백 개를 다시 만들면 오히려 느려지므로,
  // 크기 조절이 끝나고 150ms 지난 뒤 딱 한 번만 다시 시작합니다.
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    if (!canvasRef.value) return
    startEffect(canvasRef.value, props.group, props.precipitation, props.isDay)
  }, 150)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  if (canvasRef.value) {
    startEffect(canvasRef.value, props.group, props.precipitation, props.isDay)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  clearTimeout(resizeTimer)
  stopEffect()
})

watch(
  () => [props.group, props.precipitation, props.isDay],
  () => {
    if (canvasRef.value) {
      startEffect(canvasRef.value, props.group, props.precipitation, props.isDay)
    }
  },
)
</script>

<template>
  <canvas ref="canvasRef" class="weather-canvas-overlay"></canvas>
</template>

<style scoped>
.weather-canvas-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  /* 핵심: 아래 지도나 지구본 클릭을 방해하지 않음 */
  pointer-events: none;
  z-index: 50;
}
</style>
