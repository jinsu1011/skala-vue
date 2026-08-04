<script setup>
import { ref } from 'vue'
import { useWeatherStore } from '@/stores/weatherStore'
import { useGeolocation } from '@/composables/useGeolocation'
import CitySearchInput from './CitySearchInput.vue'
import PwaInstallPrompt from '@/components/mobile/PwaInstallPrompt.vue'
import SolarSystem3DStage from '@/components/solar/SolarSystem3DStage.vue'

const emit = defineEmits(['select-city'])

const weatherStore = useWeatherStore()
const { geoState, errorMessage, getCurrentNearestCity } = useGeolocation()

const isSolarModalOpen = ref(false)

// 📍 GPS 내 위치 버튼 클릭
const handleGPSClick = async () => {
  const nearestCityId = await getCurrentNearestCity()
  if (nearestCityId) {
    emit('select-city', nearestCityId)
  }
}
</script>

<template>
  <header class="top-bar">
    <!-- 앱 로고 -->
    <div class="logo-area" @click="emit('select-city', null)">
      <span class="logo-icon">🌍</span>
      <span class="logo-title">SKALA Weather Globe</span>
    </div>

    <!-- 검색창 -->
    <div class="search-area">
      <CitySearchInput @select-city="(id) => emit('select-city', id)" />
    </div>

    <!-- 우측 컨트롤 버튼들 (태양계 + 앱 설치 + GPS + 단위 토글) -->
    <div class="controls-area">
      <!-- ☀️ 태양계 표면온도 비교 버튼 -->
      <button
        class="solar-btn"
        title="태양계 표면온도 비교 뷰"
        @click="isSolarModalOpen = true"
      >
        <span class="solar-icon">☀️</span>
        <span class="solar-text">태양계 온도</span>
      </button>

      <!-- 📲 홈 화면에 추가 (PWA 설치) -->
      <PwaInstallPrompt />

      <!-- GPS 버튼 및 스피너 -->
      <button
        class="gps-btn"
        :class="{ loading: geoState === 'requesting' }"
        :disabled="geoState === 'requesting'"
        title="현재 위치에서 가까운 도시 찾기"
        @click="handleGPSClick"
      >
        <span v-if="geoState === 'requesting'" class="btn-spinner"></span>
        <span v-else class="gps-icon">📍</span>
        <span class="gps-text">현재 위치</span>
      </button>

      <!-- °C / °F 단위 토글 버튼 -->
      <button class="unit-btn" @click="weatherStore.toggleUnit()">
        <span :class="{ active: weatherStore.unit === 'C' }">°C</span>
        <span class="divider">/</span>
        <span :class="{ active: weatherStore.unit === 'F' }">°F</span>
      </button>
    </div>

    <!-- 위치 에러 안내 메시지 -->
    <div v-if="errorMessage" class="gps-error-toast">
      <span>ℹ️ {{ errorMessage }}</span>
    </div>

    <!-- ☀️ 3D 태양계 표면온도 그래픽 스테이지 -->
    <SolarSystem3DStage
      :is-open="isSolarModalOpen"
      @close="isSolarModalOpen = false"
    />
  </header>
</template>

<style scoped>
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(20px) saturate(150%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  z-index: 1000;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.logo-icon {
  font-size: 22px;
}

.logo-title {
  font-size: 17px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #ffffff 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.controls-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.solar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(250, 204, 21, 0.15);
  border: 1px solid rgba(250, 204, 21, 0.4);
  border-radius: 20px;
  color: #fde047;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.solar-btn:hover {
  background: rgba(250, 204, 21, 0.3);
  border-color: #fde047;
  transform: translateY(-1px);
}

.gps-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gps-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.unit-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.unit-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.unit-btn .active {
  color: #38bdf8;
}

.divider {
  opacity: 0.3;
}

.gps-error-toast {
  position: absolute;
  top: 72px;
  right: 24px;
  padding: 10px 16px;
  background: rgba(225, 29, 72, 0.9);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  color: #fff;
  font-size: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.3s ease;
}

@media (max-width: 768px) {
  .top-bar {
    padding: 0 14px;
  }
  .logo-title {
    display: none;
  }
  .gps-text,
  .solar-text {
    display: none;
  }
}
</style>
