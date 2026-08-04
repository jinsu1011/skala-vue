<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWeatherStore } from '@/stores/weatherStore'
import { weatherGradient } from '@/api/weatherApi'

import TopBar from '@/components/globe/TopBar.vue'
import GlobeStage from '@/components/globe/GlobeStage.vue'
import WeatherOverlay from '@/components/globe/WeatherOverlay.vue'
import CityMiniMap from '@/components/globe/CityMiniMap.vue'

import HourlyStrip from '@/components/detail/HourlyStrip.vue'
import WeeklyChart from '@/components/detail/WeeklyChart.vue'
import SunArc from '@/components/detail/SunArc.vue'
import MetricTiles from '@/components/detail/MetricTiles.vue'
import WeatherBriefing from '@/components/detail/WeatherBriefing.vue'

import FavoriteButton from '@/components/favorite/FavoriteButton.vue'
import BottomSheet from '@/components/mobile/BottomSheet.vue'

const route = useRoute()
const router = useRouter()
const weatherStore = useWeatherStore()

onMounted(async () => {
  // 1. 전체 12개 도시 날씨 불러오기
  await weatherStore.fetchAllCitiesWeather()

  // 2. URL 경로에 cityId가 지정되어 있으면 선택
  if (route.params.cityId) {
    handleSelectCity(route.params.cityId, false)
  }
})

// 도시 선택 클릭 및 라우터 주소 변경
const handleSelectCity = (cityId, pushRoute = true) => {
  if (!cityId) {
    weatherStore.selectCity(null)
    if (pushRoute && route.params.cityId) {
      router.push({ name: 'GlobeHome' })
    }
    return
  }

  weatherStore.selectCity(cityId)
  if (pushRoute && route.params.cityId !== cityId) {
    router.push({ name: 'CityWeather', params: { cityId } })
  }
}

// 선택된 도시의 상세 데이터
// (아래 watch 들이 이 값을 참조하므로 반드시 먼저 선언해야 합니다)
const detailWeather = computed(() => weatherStore.selectedCityWeather)
const selectedCity = computed(() => weatherStore.selectedCityInfo)

const detailSectionRef = ref(null)
const bottomSheetRef = ref(null)

/*
 * 모바일에서 Bottom Sheet 가 지구본을 완전히 덮었는지 여부.
 * 덮여 있으면 보이지도 않는 지구본을 계속 그릴 이유가 없으므로
 * GlobeStage 에 알려 렌더링을 멈추게 합니다.
 */
const isGlobeCovered = ref(false)

// 도시 선택 시 하단 상세 정보 패널로 부드럽게 스크롤
const scrollToDetail = () => {
  if (detailSectionRef.value) {
    detailSectionRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

/**
 * [요구사항 2] 도시를 선택하거나 검색하면 상세 정보를 보여줍니다.
 *
 * ▶ 왜 단순 setTimeout 으로는 부족한가?
 * 상세 패널은 `detailWeather`(API 응답)가 도착해야 화면에 그려집니다.
 * 정해진 시간 뒤에 무조건 스크롤하면, 네트워크가 조금만 느려도
 * 그 시점엔 패널이 아직 없어서(ref가 null) 아무 일도 일어나지 않습니다.
 * → 그래서 "데이터가 도착했을 때"를 기준으로 삼습니다.
 *
 * ▶ 모바일과 데스크톱의 처리가 다릅니다
 * - 모바일: 상세 패널이 아래에 접혀 있는 Bottom Sheet 안에 있으므로 '시트를 엽니다'
 * - 데스크톱: 페이지 아래에 이어져 있으므로 '그 위치로 스크롤합니다'
 */
const revealDetail = async () => {
  // 패널이 실제로 DOM에 그려질 때까지 한 틱 기다립니다
  await nextTick()

  const sheet = bottomSheetRef.value
  if (sheet?.isMobile) {
    sheet.open()
  } else {
    scrollToDetail()
  }
}

// 동일한 라우트 내에서 URL 파라미터가 변경될 때 (새로고침, 뒤로가기 등 대응)
watch(
  () => route.params.cityId,
  (newCityId) => {
    if (newCityId !== weatherStore.selectedCityId) {
      handleSelectCity(newCityId, false)
    }
  },
)

/*
 * 상세 날씨 데이터가 도착하면 패널을 보여줍니다.
 * (지구본 비행 애니메이션을 잠깐 감상할 수 있도록 살짝만 늦춥니다)
 */
let revealTimer = null

watch(detailWeather, (weather) => {
  if (revealTimer) clearTimeout(revealTimer)
  if (!weather) return

  revealTimer = setTimeout(() => {
    revealDetail()
  }, 500)
})

// 화면을 벗어날 때 남은 타이머를 정리합니다
onUnmounted(() => {
  if (revealTimer) clearTimeout(revealTimer)
})

// 현재 날씨에 따른 아이폰풍 동적 배경 그라데이션
const dynamicBackground = computed(() => {
  if (!detailWeather.value) return 'none'
  return weatherGradient(detailWeather.value.group, detailWeather.value.isDay)
})
</script>

<template>
  <div class="globe-weather-page" :style="{ background: dynamicBackground }">
    <!-- 상단 sticky 네비게이션 바 -->
    <TopBar @select-city="handleSelectCity" />

    <!-- 날씨 canvas 오버레이 파티클 레이어 (비/눈/햇빛/밤별/뇌우) -->
    <WeatherOverlay
      v-if="detailWeather"
      :group="detailWeather.group"
      :precipitation="detailWeather.precipitation"
      :is-day="detailWeather.isDay"
    />

    <!-- ① 지구본 100vh 메인 스테이지 -->
    <section class="stage-section">
      <GlobeStage :covered="isGlobeCovered" @select-city="handleSelectCity" />
    </section>

    <!--
      도시가 선택된 경우에만 나타나는 ② 지도 요약 & ③ 상세 예보 섹션

      BottomSheet는 화면 폭이 768px 이하일 때만 "끌어올리는 시트"로 변신하고,
      데스크톱에서는 아무 것도 감싸지 않고 내용을 그대로 통과시킵니다.
    -->
    <BottomSheet
      v-if="weatherStore.selectedCityId && detailWeather"
      ref="bottomSheetRef"
      @cover-change="(covered) => (isGlobeCovered = covered)"
    >
      <!-- 시트가 접혀 있을 때 보이는 한 줄 요약 (모바일 전용) -->
      <template #peek>
        <div class="sheet-peek-summary">
          <span class="peek-icon">{{ detailWeather.icon }}</span>
          <span class="peek-name">{{ detailWeather.name }}</span>
          <span class="peek-temp">
            {{ weatherStore.convertTemp(detailWeather.temp) }}{{ weatherStore.unitSymbol }}
          </span>
          <span class="peek-status">{{ detailWeather.status }}</span>
        </div>
      </template>

      <div ref="detailSectionRef" class="detail-panels-wrapper fade-in-panel">
        <!-- ② 현재 도시 헤더 요약 카드 -->
      <section class="city-summary-section">
        <div class="glass-card hero-summary-card">
          <!-- Fallback 뱃지 -->
          <div v-if="weatherStore.isFallback" class="fallback-badge">
            ○ 예시 데이터 (네트워크 상태 확인)
          </div>

          <!-- ⭐ 즐겨찾기 토글 (카드 우측 상단) -->
          <FavoriteButton :city-id="detailWeather.id" class="hero-fav-btn" />

          <div class="hero-top-info">
            <h1 class="hero-city-name">{{ detailWeather.name }}</h1>
            <p class="hero-region">{{ detailWeather.region }}</p>
            <p v-if="detailWeather.countryGroup === 'INT'" class="local-time-badge">
              🕒 현지 시각 {{ detailWeather.localTime }}
            </p>
          </div>

          <div class="hero-temp-row">
            <span class="hero-icon">{{ detailWeather.icon }}</span>
            <div class="hero-temp">
              {{ weatherStore.convertTemp(detailWeather.temp)
              }}<span class="unit-sym">{{ weatherStore.unitSymbol }}</span>
            </div>
          </div>

          <p class="hero-status">{{ detailWeather.status }}</p>

          <div class="hero-range-row">
            <span>최고 {{ weatherStore.convertTemp(detailWeather.tempMax) }}°</span>
            <span class="dot-sep">·</span>
            <span>최저 {{ weatherStore.convertTemp(detailWeather.tempMin) }}°</span>
          </div>
        </div>

        <!-- ② 2D Leaflet 지도 카드 -->
        <CityMiniMap
          v-if="selectedCity"
          :city="selectedCity"
          :weather="detailWeather"
          class="hero-map-card"
        />
      </section>

      <!-- 🤖 AI 날씨 요약 브리핑 (오늘의 외출 팁) -->
      <WeatherBriefing :weather="detailWeather" />

      <!-- ③ 상세 예보 4종 (시간별 / 주간 / 일출호 / 지표타일) -->
      <section class="detailed-forecast-section">
        <!-- 24시간 가로 스크롤 -->
        <HourlyStrip
          :hourly="detailWeather.hourly"
          :sunrise="detailWeather.sunrise"
          :sunset="detailWeather.sunset"
        />

        <div class="two-col-grid">
          <!-- 10일 온도 범위 막대 -->
          <WeeklyChart :daily="detailWeather.daily" :current-temp="detailWeather.temp" />

          <!-- SVG 일출/일몰 호 -->
          <SunArc
            :sunrise="detailWeather.sunrise"
            :sunset="detailWeather.sunset"
            :daylight-text="detailWeather.daylightText"
            :is-day="detailWeather.isDay"
          />
        </div>

        <!-- 8종 지표 타일 -->
        <MetricTiles :weather="detailWeather" />

        <!-- 출처 및 마지막 갱신 시각 -->
        <footer class="weather-footer">
          <span>출처: Open-Meteo · 마지막 갱신 {{ detailWeather.updatedAt }}</span>
        </footer>
        </section>
      </div>
    </BottomSheet>
  </div>
</template>

<style>
/* 디자인 토큰 및 공동 글래스모피즘 카스타일 */
.glass-card {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(14px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 24px;
  box-shadow: 0 12px 30px rgba(10, 40, 90, 0.28);
  color: #fff;
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>

<style scoped>
.globe-weather-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background: #020617;
  color: #fff;
  overflow-x: hidden;
  transition: background 0.8s ease;
}

.stage-section {
  width: 100vw;
  height: 100vh;
}

.detail-panels-wrapper {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 80px 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  z-index: 60;
}

.city-summary-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: stretch;
}

@media (max-width: 860px) {
  .city-summary-section {
    grid-template-columns: 1fr;
  }
}

.hero-summary-card {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
}

.fallback-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 4px 10px;
  background: rgba(245, 158, 11, 0.25);
  border: 1px solid rgba(245, 158, 11, 0.5);
  border-radius: 12px;
  font-size: 11px;
  color: #fbbf24;
}

/* ⭐ 즐겨찾기 버튼 — 카드 우측 상단 고정 */
.hero-fav-btn {
  position: absolute;
  top: 16px;
  right: 16px;
}

/* 📱 Bottom Sheet가 접혀 있을 때 보이는 한 줄 요약 */
.sheet-peek-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 14px;
  color: #f1f5f9;
}

.peek-icon {
  font-size: 20px;
}

.peek-name {
  font-weight: 700;
}

.peek-temp {
  font-weight: 700;
  color: #38bdf8;
  font-variant-numeric: tabular-nums;
}

.peek-status {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-city-name {
  font-size: 38px;
  font-weight: 800;
  letter-spacing: -1px;
}

.hero-region {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}

.local-time-badge {
  display: inline-block;
  margin-top: 6px;
  padding: 4px 12px;
  background: rgba(56, 189, 248, 0.2);
  border-radius: 14px;
  font-size: 12px;
  font-weight: 600;
  color: #38bdf8;
}

.hero-temp-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0 6px 0;
}

.hero-icon {
  font-size: 64px;
}

.hero-temp {
  font-size: clamp(3.5rem, 10vw, 5.5rem);
  font-weight: 100;
  letter-spacing: -4px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.unit-sym {
  font-size: 2.5rem;
  font-weight: 200;
  vertical-align: top;
}

.hero-status {
  font-size: 18px;
  font-weight: 600;
}

.hero-range-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.dot-sep {
  opacity: 0.5;
}

.detailed-forecast-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.two-col-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 860px) {
  .two-col-grid {
    grid-template-columns: 1fr;
  }
}

.weather-footer {
  text-align: center;
  padding: 20px 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

.fade-in-panel {
  animation: slideUpFade 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

/* 📱 모바일에서는 Bottom Sheet 안에 들어가므로 바깥 여백을 줄입니다 */
@media (max-width: 768px) {
  .detail-panels-wrapper {
    padding: 8px 0 40px 0;
    gap: 20px;
  }

  /* 시트가 지구본을 덮으므로 스테이지 아래 여백이 필요 없습니다 */
  .stage-section {
    height: 100vh;
  }
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
