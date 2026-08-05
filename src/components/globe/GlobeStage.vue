<script setup>
import { ref, onMounted, watch } from 'vue'
import { useWeatherStore } from '@/stores/weatherStore'
import { useGlobe } from '@/composables/useGlobe'
import FavoriteQuickBar from '@/components/favorite/FavoriteQuickBar.vue'
import GlobeLayerToggle from '@/components/globe/GlobeLayerToggle.vue'

const props = defineProps({
  // 모바일 Bottom Sheet 가 지구본을 완전히 덮고 있는지
  covered: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-city'])

const weatherStore = useWeatherStore()
const globeContainer = ref(null)

const {
  initGlobe,
  updateMarkers,
  flyTo,
  resetGlobeView,
  setWeatherLayer,
  layerStatus,
  pauseRendering,
  resumeRendering,
} = useGlobe()

/*
 * 시트에 완전히 가려지면 지구본 렌더링을 멈춥니다.
 */
watch(
  () => props.covered,
  (covered) => (covered ? pauseRendering('covered') : resumeRendering('covered')),
)

const handleMarkerClick = (cityId) => emit('select-city', cityId)

onMounted(() => {
  if (globeContainer.value) {
    initGlobe(globeContainer.value, weatherStore.citiesWeather, handleMarkerClick)
    // 스토어에 저장된 기본 레이어(구름)를 지구본 생성 직후 적용
    setWeatherLayer(weatherStore.weatherLayer, weatherStore.citiesWeather)
  }
})

// 사용자가 레이어 버튼을 누르면 스토어 값이 바뀌고, 그때마다 레이어를 다시 그립니다.
watch(
  () => weatherStore.weatherLayer,
  (layerKey) => setWeatherLayer(layerKey, weatherStore.citiesWeather),
)

/*
 * 도시 날씨가 로드되면 마커를 갱신
 */
watch(
  () => weatherStore.citiesWeather,
  (newVal) => {
    updateMarkers(newVal, handleMarkerClick)
    if (weatherStore.weatherLayer !== 'none') {
      setWeatherLayer(weatherStore.weatherLayer, newVal)
    }
  },
)

// 선택된 도시가 변경되면 카메라 이동 (비행 애니메이션)
watch(
  () => weatherStore.selectedCityId,
  (cityId) => {
    if (!cityId) {
      resetGlobeView()
      return
    }

    const city = weatherStore.citiesWeather.find((c) => c.id === cityId)
    if (city) {
      weatherStore.setViewState('flying')
      flyTo({ lat: city.lat, lng: city.lon, altitude: 0.38 }, 1800)

      setTimeout(() => {
        if (weatherStore.selectedCityId === cityId) {
          weatherStore.setViewState('focused')
        }
      }, 1850)
    }
  },
)
</script>

<template>
  <div class="globe-stage-wrapper">
    <!-- 3D 지구본 컨테이너 -->
    <div ref="globeContainer" class="globe-container"></div>

    <!-- 로딩 스피너 오버레이 (비행 중이거나 데이터 로딩 시) -->
    <div
      v-if="weatherStore.viewState === 'flying' || weatherStore.loadingDetail"
      class="flying-indicator"
    >
      <div class="spinner"></div>
      <p>도시로 이동하는 중...</p>
    </div>

    <!-- 🛰️ 기상 레이어 토글 (구름 / 강수 / 기온) -->
    <GlobeLayerToggle :status="layerStatus" />

    <!-- ⭐ 즐겨찾기 Quick Bar (저장된 도시가 있을 때만 표시) -->
    <FavoriteQuickBar @select-city="(id) => emit('select-city', id)" />

    <!-- 안내 뱃지 (Idle 상태) -->
    <div v-if="weatherStore.viewState === 'idle'" class="idle-hint-badge">
      <span>💡 도시를 검색하거나 마커를 클릭하여 줌인해 보세요</span>
    </div>
  </div>
</template>

<style>
/* 지구본 마커 스타일 (글로벌 전역 스타일로 등록해야 Globe.gl DOM 노드에 적용됨) */
.globe-marker-wrapper {
  pointer-events: auto;
  will-change: transform;
  contain: layout style;
  perspective: 1000px;
}

.globe-marker {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.75);
  border: 1.5px solid var(--marker-color, #38bdf8);
  box-shadow: 0 0 15px var(--marker-color, #38bdf8);
  transform: scale(var(--marker-scale, 1));
  transform-origin: center center;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  transform-style: preserve-3d;
}

/* 🔍 줌인 상태: 마커를 지면에 누워있는 3D 원판 받침대로 변형 */
.globe-zoomed-in .globe-marker {
  width: 36px;
  height: 36px;
  background: rgba(16, 185, 129, 0.35); /* 랜드마크 밑판 느낌의 초록/점토빛 발광 */
  border: 2px solid var(--marker-color, #34d399);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.2);
  transform: rotateX(65deg) scale(var(--marker-scale, 1));
}

.globe-marker:hover {
  transform: scale(calc(var(--marker-scale, 1) * 1.3));
}

/* 🔍 줌인 상태에서 호버 */
.globe-zoomed-in .globe-marker:hover {
  transform: rotateX(65deg) scale(calc(var(--marker-scale, 1) * 1.2));
  background: rgba(16, 185, 129, 0.5);
}

.marker-pulse {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 2px solid var(--marker-color, #38bdf8);
  animation: markerPulse 2s infinite ease-out;
  opacity: 0;
  pointer-events: none;
}

@keyframes markerPulse {
  0% {
    transform: scale(0.8);
    opacity: 0.9;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

.marker-dot {
  font-size: 16px;
  user-select: none;
  transition: all 0.3s ease;
}

/* 🔍 줌인 시 기존 단순 날씨 이모지는 자연스럽게 숨겨 랜드마크가 돋보이도록 함 */
.globe-zoomed-in .has-landmark .marker-dot {
  opacity: 0;
  transform: scale(0);
}

/* 🏛️ 클레이 랜드마크 이미지 — 지면 받침대 위에 세워진 3D 입체 카드(Billboard) 스타일 */
.marker-landmark {
  position: absolute;
  bottom: 25%; /* 받침대 중앙 중심선에 걸침 */
  left: 50%;
  /* rotateX(-65deg)로 받침대의 65도 기울기를 완벽히 상쇄해 수직으로 우뚝 선 느낌을 줌 */
  transform: translateX(-50%) rotateX(-65deg) scale(0);
  transform-origin: bottom center;
  width: 58px;
  height: 58px;
  object-fit: contain;
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.6)) contrast(1.05);
  pointer-events: none;
  opacity: 0;
  transition: transform 0.5s cubic-bezier(0.34, 1.6, 0.64, 1), opacity 0.4s ease;
}

/* 🔍 줌인 되었을 때 랜드마크가 지면에서 뿅 튀어나옴 */
.globe-zoomed-in .marker-landmark {
  opacity: 1;
  transform: translateX(-50%) rotateX(-65deg) scale(1.3);
  animation: diorama-float 4s ease-in-out infinite alternate;
}

@keyframes diorama-float {
  0% {
    transform: translateX(-50%) rotateX(-65deg) scale(1.3) translateY(0);
    filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.6));
  }
  100% {
    transform: translateX(-50%) rotateX(-65deg) scale(1.3) translateY(-3px);
    filter: drop-shadow(0 12px 16px rgba(0, 0, 0, 0.5));
  }
}

/* 마커 아래 상시 표시되는 '도시명 + 기온' 라벨 (hover 없이도 정보가 보이도록) */
.marker-label {
  display: var(--marker-label-display, block);
  position: absolute;
  top: 110%;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  padding: 3px 8px;
  background: rgba(2, 6, 23, 0.82);
  border: 1px solid rgba(159, 228, 255, 0.4);
  border-radius: 9px;
  color: #e8f6ff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: -0.2px;
  pointer-events: none;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  transition: all 0.3s ease;
}

/* 🔍 줌인 시 눕혀진 원판에 맞춰 라벨이 세워져 보이게 각도 조절 */
.globe-zoomed-in .marker-label {
  transform: translateX(-50%) rotateX(-65deg) translateY(12px);
  background: rgba(15, 23, 42, 0.9);
}

/* 나라 위에 마우스를 올렸을 때 뜨는 국가명 라벨 */
.globe-country-label {
  padding: 5px 10px;
  background: rgba(2, 6, 23, 0.88);
  border: 1px solid rgba(159, 228, 255, 0.35);
  border-radius: 10px;
  color: #e8f6ff;
  font-size: 12px;
  font-weight: 600;
}

.marker-tooltip {
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  padding: 6px 12px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
  transition: all 0.2s ease;
}

.globe-marker:hover .marker-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* 🔍 줌인 시 툴팁 각도도 조절 */
.globe-zoomed-in .globe-marker:hover .marker-tooltip {
  transform: translateX(-50%) rotateX(-65deg) translateY(-24px);
}

.tooltip-name {
  font-weight: 600;
}

.tooltip-temp {
  color: #38bdf8;
  font-weight: 700;
}

.tooltip-status {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}
</style>

<style scoped>
.globe-stage-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #020617;
}

.globe-container {
  width: 100%;
  height: 100%;
}

.flying-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 18px 32px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  color: #f8fafc;
  font-size: 15px;
  font-weight: 500;
  z-index: 30;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.3s ease;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(56, 189, 248, 0.2);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.idle-hint-badge {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 22px;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 30px;
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.3px;
  z-index: 20;
  pointer-events: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: bounceHint 3s infinite ease-in-out;
}

@keyframes bounceHint {
  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-6px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -45%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}
</style>
