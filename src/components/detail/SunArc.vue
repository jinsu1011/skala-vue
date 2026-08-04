<script setup>
import { computed } from 'vue'

const props = defineProps({
  sunrise: {
    type: String,
    default: '05:30',
  },
  sunset: {
    type: String,
    default: '19:40',
  },
  daylightText: {
    type: String,
    default: '14시간 10분',
  },
  isDay: {
    type: Boolean,
    default: true,
  },
})

// 현재 시간에 따른 태양 호 궤적 위치 계산 (0% ~ 100%)
const sunPositionPercent = computed(() => {
  const parseMinutes = (str) => {
    if (!str || !str.includes(':')) return 0
    const [h, m] = str.split(':').map(Number)
    return h * 60 + m
  }

  const rise = parseMinutes(props.sunrise)
  const set = parseMinutes(props.sunset)
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  if (currentMinutes <= rise) return 0
  if (currentMinutes >= set) return 100
  return ((currentMinutes - rise) / (set - rise)) * 100
})

// SVG 호 궤적의 (x, y) 좌표 계산
const sunCoordinates = computed(() => {
  const p = sunPositionPercent.value / 100
  const angle = Math.PI - p * Math.PI // 180도 ~ 0도
  const r = 90
  const cx = 110
  const cy = 105

  const x = cx + r * Math.cos(angle)
  const y = cy - r * Math.sin(angle)
  return { x, y }
})
</script>

<template>
  <div class="glass-card sun-card">
    <div class="card-title">
      <span>🌅 일출 및 일몰 호 (Arc)</span>
    </div>
    <div class="arc-wrapper">
      <svg class="sun-arc-svg" viewBox="0 0 220 120">
        <!-- 지평선 밑 어두운 채움 -->
        <rect x="0" y="105" width="220" height="15" fill="rgba(15, 23, 42, 0.4)" />
        <line x1="0" y1="105" x2="220" y2="105" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />

        <!-- 궤적 반원 점선 호 -->
        <path
          d="M 20 105 A 90 90 0 0 1 200 105"
          fill="none"
          stroke="rgba(255, 255, 255, 0.25)"
          stroke-width="3"
          stroke-dasharray="6,6"
        />

        <!-- 현재 시간 지나온 호 (주황색 강조) -->
        <path
          d="M 20 105 A 90 90 0 0 1 200 105"
          fill="none"
          stroke="#f97316"
          stroke-width="3.5"
          :stroke-dasharray="`${(sunPositionPercent / 100) * 283}, 283`"
        />

        <!-- 태양 아이콘 -->
        <circle :cx="sunCoordinates.x" :cy="sunCoordinates.y" r="8" fill="#facc15" />
        <circle
          :cx="sunCoordinates.x"
          :cy="sunCoordinates.y"
          r="14"
          fill="none"
          stroke="#facc15"
          stroke-width="1.5"
          opacity="0.5"
        />
      </svg>
    </div>

    <div class="sun-info-grid">
      <div class="sun-info-item">
        <span class="info-label">일출</span>
        <span class="info-val">🌅 {{ sunrise }}</span>
      </div>
      <div class="sun-info-item center">
        <span class="info-label">낮 길이</span>
        <span class="info-val">☀️ {{ daylightText }}</span>
      </div>
      <div class="sun-info-item right">
        <span class="info-label">일몰</span>
        <span class="info-val">🌇 {{ sunset }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sun-card {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-title {
  width: 100%;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
  text-transform: uppercase;
}

.arc-wrapper {
  width: 100%;
  max-width: 260px;
  display: flex;
  justify-content: center;
}

.sun-arc-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.sun-info-grid {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.sun-info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sun-info-item.center {
  align-items: center;
}

.sun-info-item.right {
  align-items: flex-end;
}

.info-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.info-val {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}
</style>
