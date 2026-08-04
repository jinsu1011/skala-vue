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
 *
 * IntersectionObserver 는 "화면 영역 안에 있는지"만 알 뿐
 * "다른 요소에 가려졌는지"는 알지 못합니다.
 * 그래서 모바일에서 시트가 지구본을 덮어도 지구본은 계속 그려졌고,
 * 그 위를 흐림 처리(backdrop-filter)까지 하느라 가장 많이 버벅였습니다.
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
 * 도시 날씨가 로드되면 마커를 갱신하고,
 * 강수/기온 레이어는 그 데이터로 그리므로 함께 다시 그립니다.
 *
 * ▶ deep: true 를 뺀 이유 (성능)
 * deep 감시는 배열 안 12개 도시 객체의 **모든 속성**을 재귀적으로 훑습니다.
 * 도시 하나에 24시간 예보 + 10일 예보가 들어 있어 수백 개 값을 매번 추적하죠.
 * 그런데 스토어는 `this.citiesWeather = data` 처럼 배열을 통째로 바꾸므로
 * deep 없이도 변화를 정확히 감지합니다. → 불필요한 추적 비용만 사라집니다.
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
/*
 * ⚠️ .globe-marker-wrapper 에는 transform 을 쓰면 안 됩니다!
 * globe.gl(CSS2DRenderer)이 이 요소의 style.transform 에
 * 화면 좌표(translate)를 직접 써 넣기 때문에, 여기에 scale 을 주면
 * 인라인 스타일에 덮여 무시되거나 마커 위치가 어긋납니다.
 * → 크기 조절은 반드시 '안쪽' 요소(.globe-marker)에 적용합니다.
 */
.globe-marker-wrapper {
  pointer-events: auto;
  /*
   * globe.gl 이 이 요소의 transform 을 1초에 60번 새로 써 넣습니다.
   * will-change 로 "이건 계속 움직일 요소"라고 미리 알려주면
   * 브라우저가 별도 레이어로 분리해 두어, 움직일 때마다 그림을
   * 다시 칠하지 않고 위치만 옮깁니다.
   */
  will-change: transform;
  /* 마커 안쪽 변화가 페이지 전체 레이아웃 계산으로 번지지 않게 가둡니다 */
  contain: layout style;
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
  /* 확대·축소에 따라 useGlobe 가 --marker-scale 값을 바꿔줍니다 */
  transform: scale(var(--marker-scale, 1));
  transform-origin: center center;
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.globe-marker:hover {
  /* 현재 확대 배율을 유지한 채로 1.35배 더 키웁니다 */
  transform: scale(calc(var(--marker-scale, 1) * 1.35));
  z-index: 100;
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
}

/* 마커 아래 상시 표시되는 '도시명 + 기온' 라벨 (hover 없이도 정보가 보이도록) */
.marker-label {
  /* 지구본을 아주 멀리서 볼 때는 useGlobe 가 none 으로 바꿔 라벨을 숨깁니다 */
  display: var(--marker-label-display, block);
  position: absolute;
  top: 108%;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  padding: 2px 7px;
  background: rgba(2, 6, 23, 0.72);
  border: 1px solid rgba(159, 228, 255, 0.35);
  border-radius: 9px;
  color: #e8f6ff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: -0.2px;
  pointer-events: none;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
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
