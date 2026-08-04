<script setup>
import { computed } from 'vue'
import { useWeatherStore } from '@/stores/weatherStore'

const props = defineProps({
  weather: {
    type: Object,
    required: true,
  },
})

const weatherStore = useWeatherStore()

// UV 지수 등급 텍스트 및 게이지 백분율
const uvInfo = computed(() => {
  const val = props.weather?.uv ?? 0
  let label = '낮음'
  let color = '#4ade80' // 녹색
  if (val >= 11) {
    label = '위험'
    color = '#a855f7'
  } else if (val >= 8) {
    label = '매우 높음'
    color = '#ef4444'
  } else if (val >= 6) {
    label = '높음'
    color = '#f97316'
  } else if (val >= 3) {
    label = '보통'
    color = '#facc15'
  }

  return {
    val,
    label,
    color,
    percent: Math.min(100, (val / 12) * 100),
  }
})
</script>

<template>
  <div class="metrics-grid">
    <!-- 1. 체감 온도 -->
    <div class="glass-card metric-tile">
      <div class="tile-header">
        <span class="tile-icon">🌡️</span>
        <span class="tile-title">체감 온도</span>
      </div>
      <div class="tile-val">
        {{ weatherStore.convertTemp(weather.feelsLike) }}{{ weatherStore.unitSymbol }}
      </div>
      <div class="tile-desc">
        {{
          weather.feelsLike > weather.temp
            ? '습도로 인해 더 덥게 느껴집니다.'
            : '바람으로 인해 더 차갑게 느껴집니다.'
        }}
      </div>
    </div>

    <!-- 2. 습도 -->
    <div class="glass-card metric-tile">
      <div class="tile-header">
        <span class="tile-icon">💧</span>
        <span class="tile-title">습도</span>
      </div>
      <div class="tile-val">{{ weather.humidity }}%</div>
      <div class="tile-desc">현재 이슬점은 {{ weatherStore.convertTemp(weather.dewPoint) }}° 입니다.</div>
    </div>

    <!-- 3. 바람 및 풍향 -->
    <div class="glass-card metric-tile">
      <div class="tile-header">
        <span class="tile-icon">💨</span>
        <span class="tile-title">바람</span>
      </div>
      <div class="tile-val-row">
        <span class="tile-val">{{ weather.wind }} <span class="unit">m/s</span></span>
        <!-- 풍향 화살표 회전 -->
        <span
          class="wind-arrow"
          :style="{ transform: `rotate(${weather.windDirection}deg)` }"
          title="풍향"
        >
          ⬆️
        </span>
      </div>
      <div class="tile-desc">풍향: {{ weather.windDirection }}°</div>
    </div>

    <!-- 4. 자외선 지수 -->
    <div class="glass-card metric-tile">
      <div class="tile-header">
        <span class="tile-icon">☀️</span>
        <span class="tile-title">자외선 지수</span>
      </div>
      <div class="tile-val">{{ uvInfo.val }} <span class="sub-label">{{ uvInfo.label }}</span></div>
      <div class="uv-gauge-bg">
        <div
          class="uv-gauge-fill"
          :style="{ width: uvInfo.percent + '%', background: uvInfo.color }"
        ></div>
      </div>
    </div>

    <!-- 5. 기압 -->
    <div class="glass-card metric-tile">
      <div class="tile-header">
        <span class="tile-icon">⏲️</span>
        <span class="tile-title">기압</span>
      </div>
      <div class="tile-val">{{ weather.pressure }} <span class="unit">hPa</span></div>
      <div class="tile-desc">해수면 평균 기압 기준</div>
    </div>

    <!-- 6. 가시거리 -->
    <div class="glass-card metric-tile">
      <div class="tile-header">
        <span class="tile-icon">👁️</span>
        <span class="tile-title">가시거리</span>
      </div>
      <div class="tile-val">{{ weather.visibility }} <span class="unit">km</span></div>
      <div class="tile-desc">
        {{ weather.visibility >= 10 ? '시야가 매우 맑습니다.' : '안개나 비로 시야가 제한됩니다.' }}
      </div>
    </div>

    <!-- 7. 구름량 -->
    <div class="glass-card metric-tile">
      <div class="tile-header">
        <span class="tile-icon">☁️</span>
        <span class="tile-title">구름량</span>
      </div>
      <div class="tile-val">{{ weather.cloudCover }}%</div>
      <div class="tile-desc">하늘 전체 대비 구름의 비율</div>
    </div>

    <!-- 8. 강수량 -->
    <div class="glass-card metric-tile">
      <div class="tile-header">
        <span class="tile-icon">🌧️</span>
        <span class="tile-title">강수량</span>
      </div>
      <div class="tile-val">{{ weather.precipitation }} <span class="unit">mm</span></div>
      <div class="tile-desc">최근 1시간 실시간 강수량</div>
    </div>
  </div>
</template>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 520px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

.metric-tile {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 120px;
}

.tile-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.tile-val-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tile-val {
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
  margin: 6px 0 4px 0;
}

.unit {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

.sub-label {
  font-size: 14px;
  font-weight: 600;
  margin-left: 6px;
}

.tile-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.3;
}

.wind-arrow {
  display: inline-block;
  font-size: 20px;
  transition: transform 0.3s ease;
}

.uv-gauge-bg {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
}

.uv-gauge-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}
</style>
