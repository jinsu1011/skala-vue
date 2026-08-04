<script setup>
/**
 * 🛰️ 3D 지구본 기상 레이어 토글 버튼 묶음
 *
 * 실제 텍스처를 붙이고 떼는 일은 useGlobe 컴포저블이 담당하고,
 * 이 컴포넌트는 "어떤 레이어를 원하는지"만 Pinia 스토어에 기록합니다.
 * (관심사 분리 — UI는 상태만 바꾸고, WebGL 처리는 컴포저블이 반응해서 수행)
 */
import { computed } from 'vue'
import { GLOBE_LAYERS } from '@/composables/useGlobe'
import { useWeatherStore } from '@/stores/weatherStore'

defineProps({
  // useGlobe가 알려주는 { active, loading, error } 로딩 상태
  status: {
    type: Object,
    default: () => ({ active: 'none', loading: false, error: null }),
  },
})

const weatherStore = useWeatherStore()

// 정의표(GLOBE_LAYERS)를 배열로 바꿔 v-for로 버튼을 자동 생성합니다.
const layers = Object.values(GLOBE_LAYERS)

// 현재 켜진 레이어에 맞는 범례(색이 무엇을 뜻하는지)
const LEGENDS = {
  cloud: {
    title: '운량 (구름 많음)',
    gradient: 'linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.95))',
    min: '맑음',
    max: '흐림',
  },
  rain: {
    title: '강수확률',
    gradient: 'linear-gradient(90deg, rgba(56,189,248,0.15), rgba(56,189,248,1))',
    min: '0%',
    max: '100%',
  },
  temp: {
    title: '기온',
    gradient: 'linear-gradient(90deg, #2563eb, #38bdf8, #4ade80, #facc15, #f97316, #ef4444)',
    min: '-20°',
    max: '40°',
  },
}

const legend = computed(() => LEGENDS[weatherStore.weatherLayer] ?? null)
</script>

<template>
  <div class="layer-toggle">
    <span class="toggle-label">기상 레이어</span>

    <div class="toggle-buttons">
      <button
        v-for="layer in layers"
        :key="layer.key"
        class="layer-btn"
        :class="{ active: weatherStore.weatherLayer === layer.key }"
        :title="`${layer.label} 레이어 켜기/끄기`"
        @click="weatherStore.setWeatherLayer(layer.key)"
      >
        <!-- 이 레이어를 불러오는 중이면 아이콘 자리에 스피너 표시 -->
        <span
          v-if="status.loading && status.active === layer.key"
          class="layer-spinner"
          aria-label="불러오는 중"
        ></span>
        <span v-else class="layer-icon">{{ layer.icon }}</span>
        <span class="layer-name">{{ layer.label }}</span>
      </button>
    </div>

    <!-- 켜져 있는 레이어가 무엇을 뜻하는지 알려주는 범례 -->
    <div v-if="legend" class="layer-legend">
      <span class="legend-title">{{ legend.title }}</span>
      <div class="legend-bar" :style="{ background: legend.gradient }"></div>
      <div class="legend-scale">
        <span>{{ legend.min }}</span>
        <span>{{ legend.max }}</span>
      </div>
    </div>

    <p v-if="status.error" class="layer-error">⚠️ {{ status.error }}</p>
  </div>
</template>

<style scoped>
.layer-toggle {
  position: absolute;
  top: 82px;
  right: 20px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.68);
  backdrop-filter: blur(18px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
}

.toggle-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: rgba(255, 255, 255, 0.6);
}

.toggle-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.layer-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.layer-btn:hover {
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(56, 189, 248, 0.6);
  color: #fff;
}

/* 켜져 있는 레이어는 파란 발광으로 강조 */
.layer-btn.active {
  background: rgba(56, 189, 248, 0.28);
  border-color: #38bdf8;
  color: #fff;
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.35);
}

.layer-icon {
  font-size: 15px;
  line-height: 1;
}

.layer-spinner {
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: layerSpin 0.8s linear infinite;
}

@keyframes layerSpin {
  to {
    transform: rotate(360deg);
  }
}

.layer-legend {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.legend-title {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
}

.legend-bar {
  height: 7px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.legend-scale {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.5);
}

.layer-error {
  max-width: 150px;
  font-size: 10px;
  line-height: 1.4;
  color: #fbbf24;
}

@media (max-width: 768px) {
  .layer-toggle {
    top: 74px;
    right: 12px;
    padding: 8px;
  }
  .toggle-label {
    display: none;
  }
  .layer-name {
    display: none;
  }
  .layer-legend {
    display: none;
  }
  .layer-btn {
    padding: 8px;
    justify-content: center;
  }
}
</style>
