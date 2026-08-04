<script setup>
import { computed, onMounted, onUnmounted, provide, reactive, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'
import {
  FALLBACK_WEATHER,
  fetchCurrentWeather,
  weatherGradient,
  describeApiError,
} from '@/api/weatherApi'
import { useConfigStore } from '@/stores/configStore'

/*
 * ══════════════════════════════════════════════════════════════
 *  [과제 4 - 요구사항 3] WeatherHomeView.vue
 *   - 페이지 단위 컴포넌트(View). <RouterView/> 에 직접 꽂힌다.
 *   - 상세보기 클릭 시 alert() 대신 Programmatic Navigation
 *  [레이아웃] 네이버 날씨처럼 "대표 지역 요약(히어로) + 지역 목록" 2단 구성
 * ══════════════════════════════════════════════════════════════
 */

// useRouter(): 페이지를 '이동시키는' 기계 / useRoute(): 지금 주소를 '읽는' 정보
const router = useRouter()
const route = useRoute()

/* ══════════ 반응형 상태는 전부 부모(관제탑)가 소유 ══════════ */
const searchQuery = ref('')
const selectedCityId = ref('city_01') // 히어로에 크게 띄울 대표 지역
const weatherList = ref([...FALLBACK_WEATHER])

// computed: 의존값이 바뀔 때만 재계산, 나머지는 캐시 재사용
const filteredWeatherList = computed(() => {
  const keyword = searchQuery.value.trim()
  if (!keyword) return weatherList.value
  return weatherList.value.filter((item) => item.name.includes(keyword))
})

// 대표 지역 객체. 목록에서 못 찾으면 첫 번째 도시로 대체한다.
const heroCity = computed(
  () => weatherList.value.find((c) => c.id === selectedCityId.value) ?? weatherList.value[0],
)

// 히어로 배경은 '지금 그 도시의 날씨'에 따라 바뀐다 (아이폰 날씨앱 방식)
const heroStyle = computed(() => ({
  background: weatherGradient(heroCity.value?.group, heroCity.value?.isDay !== false),
}))

/* ══════════ reactive() 로 UI 상태를 하나로 묶기 ══════════ */
const uiState = reactive({
  isLoading: true,
  lastUpdated: '-',
  isAutoRefresh: false,
  isLive: false,
  errorMessage: '',
})

/* ══════════ [실습 과제 p.209 - 요구사항 3] 메인 날씨에 단위 설정 적용 ══════════
 *
 *  예전에는 이 View 가 tempUnit 을 직접 ref 로 들고 provide 했다.
 *  이제 단위 버튼은 App.vue 의 내비게이션 바(UnitToggler)에 있으므로
 *  '부모 → 자식' 통로인 provide 로는 값을 받을 수 없다.
 *  → 전역 저장소(configStore)를 진짜 원본으로 삼고,
 *    이미 inject 로 값을 받고 있는 WeatherCard 를 고치지 않기 위해
 *    store 의 값을 그대로 provide 로 흘려보낸다. (강의자료 150p)
 */
const configStore = useConfigStore()

// 'C' / 'F' 한 글자 표기. store 값이 바뀌면 자동으로 다시 계산된다.
const tempUnit = computed(() => configStore.unitCode)
provide('tempUnit', tempUnit)

// 히어로의 기온도 store 의 변환 규칙을 그대로 따른다
const toUnit = (celsius) => configStore.convert(celsius)

/* ══════════ 실시간 날씨 API 연동 (OpenWeatherMap → Open-Meteo) ══════════ */
// 지금 화면에 뿌려진 값이 어느 API 에서 왔는지 표시용
const SOURCE_NAMES = {
  openweather: 'OpenWeatherMap',
  'open-meteo': 'Open-Meteo',
  'met.no': 'MET Norway',
}
const sourceLabel = computed(() => SOURCE_NAMES[weatherList.value[0]?.source] ?? '알 수 없음')

const loadWeather = async () => {
  try {
    weatherList.value = await fetchCurrentWeather()
    uiState.isLive = true
    uiState.errorMessage = ''
  } catch (error) {
    // 두 API 가 모두 실패했을 때만 여기로 온다 → 초기 Mock 데이터를 그대로 쓴다
    uiState.isLive = false
    uiState.errorMessage = `실시간 조회 실패 (${describeApiError(error)}) — 예시 데이터로 표시 중`
    console.warn('⚠️ 날씨 API 호출 실패, 폴백 데이터 사용:', error.message)
  } finally {
    uiState.isLoading = false
    uiState.lastUpdated = new Date().toLocaleTimeString('ko-KR')
  }
}

/* ══════════ Lifecycle Hook (강의자료 133~135p) ══════════ */
let refreshTimer = null

const toggleAutoRefresh = () => {
  uiState.isAutoRefresh = !uiState.isAutoRefresh

  if (uiState.isAutoRefresh) {
    refreshTimer = setInterval(loadWeather, 60000)
  } else {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

onMounted(() => {
  console.log('✅ [onMounted] DOM 부착 완료 — 실시간 날씨 API 호출 시작')
  loadWeather()

  // Query String Routing 복원 (강의자료 169p)
  // 주소창에 ?search=수원 이 이미 있으면 그 값으로 검색 상태를 되살린다.
  if (route.query.search) {
    searchQuery.value = route.query.search
  }
})

onUnmounted(() => {
  // ★ 이걸 안 하면 페이지를 떠나도 타이머가 백그라운드에서 영원히 돈다 (메모리 누수)
  clearInterval(refreshTimer)
  console.log('🧹 [onUnmounted] 타이머 청소 완료')
})

/* ══════════ 감시자 ══════════ */
watch(selectedCityId, (newVal, oldVal) => {
  console.log(`👁️ [watch 감지] 대표 지역 변경: "${oldVal}" -> "${newVal}"`)
})

// watchEffect: 대상을 안 적어도 내부에서 쓴 반응형 값을 자동 추적. 최초 1회 즉시 실행.
watchEffect(() => {
  console.log(
    `🤖 [watchEffect] 검색어 '${searchQuery.value}' → ${filteredWeatherList.value.length}건 매칭`,
  )
})

// Multi-Source Watch — 여러 값을 한 번에 감시
watch([searchQuery, tempUnit], ([newQuery, newUnit], [oldQuery, oldUnit]) => {
  console.log(
    `📊 [Multi-Source watch] 검색어 '${oldQuery}'->'${newQuery}' / 단위 °${oldUnit}->°${newUnit}`,
  )
})

// 검색어가 바뀌면 주소창의 ?search= 도 같이 갱신한다.
// push 가 아니라 replace 를 쓰는 이유: 글자 한 자마다 히스토리가 쌓이면
// 뒤로가기를 여러 번 눌러야 이전 페이지로 나갈 수 있게 된다.
watch(searchQuery, (newQuery) => {
  router.replace({ query: newQuery ? { search: newQuery } : {} })
})

/* ══════════ 자식이 올려보낸 이벤트 처리 ══════════ */
const handleUpdateQuery = (newQuery) => {
  searchQuery.value = newQuery
}

// 카드를 누르면 그 지역이 위쪽 히어로에 크게 표시된다
const handleSelectCity = (city) => {
  selectedCityId.value = city.id
}

/*
 * ★ [과제 4 핵심] alert() 를 제거하고 실제 페이지 이동으로 바꾼 자리
 *   <RouterLink> 클릭이 아니라 스크립트가 판단해서 이동시키므로
 *   Programmatic Navigation 이라 부른다. (강의자료 171p)
 */
const goDetail = (city) => {
  router.push('/weather/' + city.id)
}

// 오늘 날짜 문구 (네이버 날씨 상단의 "8월 4일 (월)" 같은 표기)
const todayLabel = new Date().toLocaleDateString('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'short',
})
</script>

<template>
  <div class="home">
    <!-- ═══════ ① 대표 지역 요약 (히어로) ═══════ -->
    <section class="hero" :style="heroStyle" @click="goDetail(heroCity)">
      <div v-if="uiState.isLoading" class="hero-loading">⏳ 실시간 날씨를 불러오는 중…</div>

      <template v-else-if="heroCity">
        <div class="hero-top">
          <div>
            <div class="hero-city">{{ heroCity.name }}</div>
            <div class="hero-region">{{ heroCity.region }}</div>
          </div>
          <div class="hero-date">{{ todayLabel }}</div>
        </div>

        <div class="hero-main">
          <div class="hero-icon">{{ heroCity.icon }}</div>
          <div class="hero-temp">
            {{ toUnit(heroCity.temp) }}<span class="deg">°{{ tempUnit }}</span>
          </div>
          <div class="hero-meta">
            <div class="hero-status">{{ heroCity.status }}</div>
            <div class="hero-range">
              최고 {{ toUnit(heroCity.tempMax) }}° / 최저 {{ toUnit(heroCity.tempMin) }}°
            </div>
          </div>
        </div>

        <div class="hero-stats">
          <div class="stat">
            <span class="stat-label">체감</span>
            <span class="stat-value">{{ toUnit(heroCity.feelsLike) }}°</span>
          </div>
          <div class="stat">
            <span class="stat-label">습도</span>
            <span class="stat-value">{{ heroCity.humidity }}%</span>
          </div>
          <div class="stat">
            <span class="stat-label">바람</span>
            <span class="stat-value">{{ heroCity.wind }}m/s</span>
          </div>
        </div>

        <div class="hero-cta">자세히 보기 ›</div>
      </template>
    </section>

    <!-- ═══════ ② 검색 ═══════ -->
    <BaseDashboardCard>
      <template #header="{ open, toggle }">
        <h3>🔍 지역 검색</h3>
        <button class="ghost-btn" type="button" @click="toggle">
          {{ open ? '접기' : '펼치기' }}
        </button>
      </template>

      <SearchBar
        :query="searchQuery"
        :result-count="filteredWeatherList.length"
        @update-query="handleUpdateQuery"
      />
    </BaseDashboardCard>

    <!-- ═══════ ③ 지역별 날씨 목록 ═══════ -->
    <BaseDashboardCard>
      <template #header="{ open, toggle }">
        <h3>
          🏙️ 지역별 날씨
          <span class="count">{{ filteredWeatherList.length }}</span>
          <span class="source-tag" :class="uiState.isLive ? 'live' : 'offline'">
            {{ uiState.isLive ? '실시간' : '예시' }}
          </span>
        </h3>
        <div class="header-actions">
          <button
            class="ghost-btn"
            type="button"
            :disabled="uiState.isLoading"
            @click="loadWeather"
          >
            {{ uiState.isLoading ? '조회 중…' : '↻ 새로고침' }}
          </button>
          <!-- 전역 store 를 토글 → 상단 UnitToggler 와 모든 WeatherCard 가 한 번에 반응 -->
          <button class="ghost-btn" type="button" @click="configStore.toggleUnit">
            °{{ tempUnit }} → °{{ tempUnit === 'C' ? 'F' : 'C' }}
          </button>
          <button
            class="ghost-btn"
            :class="{ active: uiState.isAutoRefresh }"
            type="button"
            @click="toggleAutoRefresh"
          >
            {{ uiState.isAutoRefresh ? '⏸ 자동갱신' : '▶ 자동갱신' }}
          </button>
          <button class="ghost-btn" type="button" @click="toggle">
            {{ open ? '접기' : '펼치기' }}
          </button>
        </div>
      </template>

      <!-- 로딩 중에는 스켈레톤을 보여준다 (빈 화면보다 체감 속도가 빠르다) -->
      <div v-if="uiState.isLoading" class="skeleton-wrap">
        <div v-for="n in 5" :key="n" class="skeleton"></div>
      </div>

      <template v-else>
        <div v-if="filteredWeatherList.length > 0">
          <!--
            슬롯 안에 있지만 이 마크업은 '부모 스코프'에서 컴파일된다.
            그래서 WeatherCard 와 직접 바인딩/통신이 가능하다. (강의자료 158p 참고사항 6)
          -->
          <WeatherCard
            v-for="city in filteredWeatherList"
            :key="city.id"
            :city="city"
            :selected="city.id === selectedCityId"
            @select-card="handleSelectCity"
            @click-detail="goDetail"
          />
        </div>
        <div v-else class="empty-result">
          <div class="empty-icon">🔎</div>
          검색 결과가 없습니다.
        </div>

        <p v-if="uiState.errorMessage" class="api-error">⚠️ {{ uiState.errorMessage }}</p>
        <p class="meta">
          {{ uiState.lastUpdated }} 기준<span v-if="uiState.isLive"> · 출처 {{ sourceLabel }}</span>
        </p>
      </template>
    </BaseDashboardCard>
  </div>
</template>

<style scoped>
/* ═══════ 히어로 ═══════ */
.hero {
  border-radius: 22px;
  padding: 22px 24px 18px;
  margin-bottom: 14px;
  color: #fff;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(20, 60, 110, 0.18);
  transition: transform 0.2s ease;
  min-height: 210px;
}
.hero:hover {
  transform: translateY(-2px);
}
.hero-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 168px;
  opacity: 0.9;
}
.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}
.hero-city {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}
.hero-region {
  font-size: 0.78rem;
  opacity: 0.75;
  margin-top: 1px;
}
.hero-date {
  font-size: 0.8rem;
  opacity: 0.8;
  white-space: nowrap;
}

.hero-main {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 14px 0 18px;
}
.hero-icon {
  font-size: 3.2rem;
  line-height: 1;
}
.hero-temp {
  font-size: 3.6rem;
  font-weight: 200;
  line-height: 1;
  letter-spacing: -3px;
}
.hero-temp .deg {
  font-size: 1.3rem;
  font-weight: 300;
  letter-spacing: 0;
  vertical-align: super;
  margin-left: 2px;
}
.hero-meta {
  margin-left: auto;
  text-align: right;
}
.hero-status {
  font-size: 1rem;
  font-weight: 600;
}
.hero-range {
  font-size: 0.82rem;
  opacity: 0.85;
  margin-top: 2px;
}

.hero-stats {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  padding: 10px 4px;
  backdrop-filter: blur(6px);
}
.stat {
  flex: 1;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.16);
}
.stat:last-child {
  border-right: none;
}
.stat-label {
  display: block;
  font-size: 0.7rem;
  opacity: 0.75;
}
.stat-value {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 1px;
}
.hero-cta {
  text-align: right;
  font-size: 0.78rem;
  opacity: 0.8;
  margin-top: 8px;
}

/* ═══════ 카드 헤더 ═══════ */
.count {
  font-size: 0.78rem;
  font-weight: 600;
  color: #1e88e5;
  background: #e8f1fd;
  border-radius: 10px;
  padding: 1px 8px;
}
.source-tag {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}
.source-tag.live {
  color: #15803d;
  background: #e7f6ec;
}
.source-tag.offline {
  color: #a16207;
  background: #fef6e4;
}
.header-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.ghost-btn {
  padding: 5px 11px;
  font-size: 0.76rem;
  border: 1px solid #e5e9ef;
  border-radius: 999px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
}
.ghost-btn:hover {
  background: #f4f7fa;
  color: #1e88e5;
}
.ghost-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ghost-btn.active {
  border-color: #86c79a;
  color: #15803d;
  background: #e7f6ec;
}

/* ═══════ 목록 상태 ═══════ */
.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.skeleton {
  height: 66px;
  border-radius: 14px;
  background: linear-gradient(90deg, #f1f4f8 25%, #e7ecf2 37%, #f1f4f8 63%);
  background-size: 400% 100%;
  animation: shimmer 1.3s ease infinite;
}
@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}
.empty-result {
  text-align: center;
  color: #9aa4b0;
  padding: 32px 0;
  font-size: 0.9rem;
}
.empty-icon {
  font-size: 1.8rem;
  margin-bottom: 6px;
}
.api-error {
  font-size: 0.8rem;
  color: #a16207;
  background: #fef6e4;
  border-radius: 8px;
  padding: 8px 12px;
  margin: 10px 0 0;
}
.meta {
  font-size: 0.74rem;
  color: #b6bec7;
  text-align: right;
  margin: 10px 2px 0;
}

@media (max-width: 480px) {
  .hero-temp {
    font-size: 3rem;
  }
  .hero-meta {
    margin-left: 0;
  }
  .hero-main {
    flex-wrap: wrap;
  }
}
</style>
