<script setup>
import { computed } from 'vue'
import { useWeatherStore } from '@/stores/weatherStore'

const props = defineProps({
  daily: {
    type: Array,
    default: () => [],
  },
  currentTemp: {
    type: Number,
    default: 0,
  },
})

const weatherStore = useWeatherStore()

// 10일 전체 최저/최고 기온 구하기 (막대 백분율 계산용)
const overallMinMax = computed(() => {
  if (!props.daily || props.daily.length === 0) return { min: 0, max: 40 }
  const mins = props.daily.map((d) => d.min)
  const maxs = props.daily.map((d) => d.max)
  return {
    min: Math.min(...mins),
    max: Math.max(...maxs),
  }
})

// 막대의 왼쪽(left %)과 너비(width %) 및 현재 온도 점 position 계산
const getBarStyle = (min, max) => {
  const { min: overallMin, max: overallMax } = overallMinMax.value
  const range = overallMax - overallMin || 1
  const left = ((min - overallMin) / range) * 100
  const width = ((max - min) / range) * 100
  return {
    left: `${Math.max(0, left)}%`,
    width: `${Math.max(8, width)}%`,
  }
}

const getCurrentDotPos = (min, max) => {
  const range = max - min || 1
  const pos = ((props.currentTemp - min) / range) * 100
  return `${Math.max(0, Math.min(100, pos))}%`
}
</script>

<template>
  <div class="glass-card weekly-card">
    <div class="card-title">
      <span>🗓️ 10일간의 예보</span>
    </div>
    <div class="weekly-list">
      <div v-for="(day, index) in daily" :key="index" class="weekly-row">
        <span class="day-label">{{ day.label }}</span>
        <span class="day-icon">{{ day.icon }}</span>
        <span class="day-pop">{{ day.pop > 0 ? day.pop + '%' : '' }}</span>

        <span class="temp-min">{{ weatherStore.convertTemp(day.min) }}°</span>

        <!-- 온도 범위 그라데이션 막대 -->
        <div class="bar-container">
          <div class="bar-fill" :style="getBarStyle(day.min, day.max)">
            <!-- 오늘 행에는 현재 기온 위치에 흰 점 배치 -->
            <span
              v-if="index === 0"
              class="current-temp-dot"
              :style="{ left: getCurrentDotPos(day.min, day.max) }"
            ></span>
          </div>
        </div>

        <span class="temp-max">{{ weatherStore.convertTemp(day.max) }}°</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weekly-card {
  padding: 18px 20px;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 14px;
  text-transform: uppercase;
}

.weekly-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weekly-row {
  display: grid;
  grid-template-columns: 48px 32px 42px 36px 1fr 36px;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}

.day-label {
  font-weight: 600;
  color: #f8fafc;
}

.day-icon {
  font-size: 20px;
}

.day-pop {
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
}

.temp-min {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.temp-max {
  font-weight: 700;
  color: #fff;
  text-align: left;
  font-variant-numeric: tabular-nums;
}

.bar-container {
  position: relative;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  overflow: visible;
}

.bar-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 3px;
  background: linear-gradient(90deg, #38bdf8 0%, #facc15 50%, #f97316 100%);
}

.current-temp-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #ffffff;
  border: 2px solid #0f172a;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.9);
}
</style>
