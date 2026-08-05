<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { CITIES, FALLBACK_WEATHER, fetchCityForecast, weatherGradient } from '@/api/weatherApi'
import { useConfigStore } from '@/stores/configStore'
import { getLandmark } from '@/data/landmarkData'

/*
 * [실습 과제 p.209 - 요구사항 3] 상세 날씨에도 단위 설정 변경 적용
 *  상단 UnitToggler 를 눌러 놓고 상세 페이지로 들어와도 값이 유지된다.
 *  → 페이지를 갈아끼워도 Pinia 창고는 그대로 남아있기 때문. (props/provide 로는 불가능)
 */
const configStore = useConfigStore()

// 섭씨 원본 → 현재 단위로 변환하는 짧은 별칭
const t = (celsius) => configStore.convert(celsius)

/*
 * ══════════════════════════════════════════════════════════════
 *  [과제 4 - 요구사항 4] WeatherDetailView.vue
 *   - 지역별 상세 기상관측 정보 페이지
 *   - 도시 코드에 해당하는 Mock Data 를 임시 활용
 *   - 동적 경로 매칭으로 받은 cityId 로 Mount 시점에 도시 객체 선택
 *  [레이아웃] 아이폰 날씨앱처럼 "그라데이션 배경 + 시간별 + 주간 + 상세지표"
 * ══════════════════════════════════════════════════════════════
 *
 *  [데이터를 두 겹으로 쌓는 이유]
 *   1층 Mock  : API 가 주지 않는 안내 문구 + 통신 실패 시 대비값
 *   2층 실시간 : 기온/시간별/주간 예보 (1층 값을 덮어쓴다)
 *
 *  ⚠️ 왜 여기서 API 를 '다시' 호출하나?
 *     router.push 로 페이지를 옮기는 순간 WeatherHomeView 가 파괴되면서(onUnmounted)
 *     그 안의 weatherList 도 함께 사라지기 때문. 컴포넌트가 각자 데이터를 들고 있는 구조의 한계다.
 *     → 이걸 해결하는 것이 다음 시간의 Pinia(전역 상태 저장소). (강의자료 179p)
 */

const route = useRoute() // 현재 주소 '정보' 를 읽는다
const router = useRouter() // 페이지를 '이동시키는' 기계

// [Mock Data] API 가 절대 주지 않는 값 (지역 안내 문구)
const MOCK_COMMENT = {
  city_01: '도심 열섬 현상으로 체감온도가 실제보다 높게 느껴질 수 있습니다.',
  city_02: '경기 남부 내륙으로 일교차가 큰 편입니다.',
  city_03: '해안가 바람이 다소 강하니 우산 사용에 주의하세요.',
  city_04: '서해안 지역으로 안개가 자주 발생합니다.',
  city_05: '중부 내륙 분지 지형으로 낮 기온이 빠르게 오릅니다.',
  city_06: '분지 지형 특성상 여름철 기온이 전국에서 가장 높은 편입니다.',
  city_07: '호남 내륙으로 여름철 습도가 높습니다.',
  city_08: '한라산 영향으로 지역별 날씨 차이가 큽니다.',
}

/** 통신 실패 시 쓸 Mock 상세 객체를 만든다 */
const buildMockDetail = (cityId) => {
  const base = FALLBACK_WEATHER.find((c) => c.id === cityId)
  if (!base) return null
  return {
    ...base,
    comment: MOCK_COMMENT[cityId] ?? '',
    sunrise: '-',
    sunset: '-',
    uv: 0,
    pop: 0,
    hourly: [],
    daily: [],
  }
}

const cityDetail = ref(null)
const isLive = ref(false) // 실시간 관측값인지, Mock 예시 데이터인지
const isLoading = ref(false)

/*
 *  주소창의 :cityId 자리 값을 읽어서 해당 도시 정보를 채운다.
 *    /weather/city_01  →  route.params.cityId === 'city_01'
 *
 *  ① 먼저 Mock 으로 화면을 즉시 채우고 (사용자가 빈 화면을 안 보게)
 *  ② 실시간 예보가 도착하면 통째로 교체한다
 */
const loadCityDetail = async () => {
  const cityId = route.params.cityId

  const mock = buildMockDetail(cityId)
  cityDetail.value = mock
  isLive.value = false
  console.log(`📍 [WeatherDetailView] cityId="${cityId}" Mock 조회 결과:`, mock)

  if (!mock) return // 존재하지 않는 도시면 API 를 호출할 이유가 없다

  isLoading.value = true
  try {
    const live = await fetchCityForecast(cityId)
    if (live) {
      // 전개 연산자(...) 순서가 핵심. 뒤에 오는 live 가 앞의 mock 을 덮어쓴다.
      // → comment 는 Mock 유지, 나머지 관측값은 실시간으로 교체
      cityDetail.value = { ...mock, ...live }
      isLive.value = true
      console.log(`🌡️ [WeatherDetailView] '${live.name}' 실시간 예보 반영`, live)
    }
  } catch (error) {
    // 실패해도 ①의 Mock 이 남아 화면이 비지 않는다
    console.warn('⚠️ 상세 예보 API 호출 실패, Mock 유지:', error.message)
  } finally {
    isLoading.value = false
  }
}

// [요구사항] Mount 시점에 도시 객체 선택
onMounted(loadCityDetail)

/*
 *  ⚠️ 초보자가 가장 많이 걸리는 함정
 *  같은 라우트(/weather/:cityId) 안에서 city_01 → city_02 로만 이동하면
 *  Vue 는 컴포넌트를 '재사용' 하므로 onMounted 가 다시 실행되지 않는다.
 *  → params 자체를 watch 로 감시해 데이터를 다시 불러온다.
 */
watch(() => route.params.cityId, loadCityDetail)

/* ══════════ 화면 표현용 계산 ══════════ */

// 배경 그라데이션은 '지금 그 도시의 날씨 + 낮/밤'에 따라 바뀐다
const pageStyle = computed(() => ({
  background: weatherGradient(cityDetail.value?.group, cityDetail.value?.isDay !== false),
}))

// 주간 예보 막대: 7일 전체의 최저~최고 폭을 100% 로 두고 각 날의 구간을 비율로 그린다
const weekRange = computed(() => {
  const days = cityDetail.value?.daily ?? []
  if (!days.length) return { min: 0, max: 1 }
  return {
    min: Math.min(...days.map((d) => d.min)),
    max: Math.max(...days.map((d) => d.max)),
  }
})

const barStyle = (day) => {
  const { min, max } = weekRange.value
  const span = max - min || 1
  return {
    left: `${((day.min - min) / span) * 100}%`,
    width: `${((day.max - day.min) / span) * 100}%`,
  }
}

// 시간별 예보 그래프의 세로 위치 (온도가 높을수록 위로)
const hourRange = computed(() => {
  const hours = cityDetail.value?.hourly ?? []
  if (!hours.length) return { min: 0, max: 1 }
  return { min: Math.min(...hours.map((h) => h.temp)), max: Math.max(...hours.map((h) => h.temp)) }
})

const hourOffset = (temp) => {
  const { min, max } = hourRange.value
  const span = max - min || 1
  // 온도가 높을수록 위(작은 margin-top)
  return { marginTop: `${(1 - (temp - min) / span) * 26}px` }
}

// UV 지수 문구 (0~2 낮음 / 3~5 보통 / 6~7 높음 / 8~10 매우높음 / 11+ 위험)
const uvLabel = computed(() => {
  const uv = cityDetail.value?.uv ?? 0
  if (uv >= 11) return '위험'
  if (uv >= 8) return '매우 높음'
  if (uv >= 6) return '높음'
  if (uv >= 3) return '보통'
  return '낮음'
})

// Programmatic Navigation — 스크립트로 페이지 이동 (강의자료 171p)
const goHome = () => router.push('/') // 히스토리에 쌓으며 메인으로
const goBack = () => router.go(-1) // 브라우저 뒤로가기와 동일 (= router.back())

// 랜드마크 이미지 (해외 도시만)
const landmark = computed(() => {
  if (!cityDetail.value) return null
  return getLandmark(cityDetail.value.id)
})
</script>

<template>
  <div class="detail-page">
    <!-- ═══════ 도시를 찾은 경우 ═══════ -->
    <template v-if="cityDetail">
      <!-- ① 상단 대형 현재 날씨 (아이폰 날씨앱 헤드) -->
      <section class="sky" :style="pageStyle">
        <div class="sky-head">
          <button class="back-chip" type="button" @click="goBack">‹ 뒤로</button>
          <span class="live-tag" :class="isLive ? 'on' : 'off'">
            {{ isLoading ? '조회 중…' : isLive ? '● 실시간' : '○ 예시 데이터' }}
          </span>
        </div>

        <div class="sky-city">{{ cityDetail.name }}</div>
        <div class="sky-region">{{ cityDetail.region }}</div>

        <div class="sky-temp">
          {{ t(cityDetail.temp) }}<span class="deg">{{ configStore.unitSymbol }}</span>
        </div>
        <div class="sky-status">{{ cityDetail.icon }} {{ cityDetail.status }}</div>
        <div class="sky-range">
          최고 {{ t(cityDetail.tempMax) }}° · 최저 {{ t(cityDetail.tempMin) }}°
        </div>

        <p v-if="cityDetail.comment" class="sky-comment">💬 {{ cityDetail.comment }}</p>

        <!-- 🏛️ 랜드마크 이미지 -->
        <div v-if="landmark && landmark.image" class="landmark-card">
          <img :src="landmark.image" :alt="landmark.name" class="landmark-img" />
          <span class="landmark-name">{{ landmark.name }}</span>
        </div>

        <!-- ② 시간별 예보 (가로 스크롤) -->
        <div v-if="cityDetail.hourly.length" class="panel">
          <div class="panel-title">시간별 예보</div>
          <div class="hourly">
            <div v-for="hour in cityDetail.hourly" :key="hour.time" class="hour">
              <span class="hour-label">{{ hour.label }}</span>
              <!-- 강수확률을 안 주는 API 면 그 자리를 강수량(mm)으로 대신 채운다 -->
              <span v-if="hour.pop === null || hour.pop === undefined" class="hour-pop dim">
                {{ hour.precipitation > 0 ? `${hour.precipitation}mm` : '—' }}
              </span>
              <span v-else class="hour-pop" :class="{ dim: hour.pop < 20 }">{{ hour.pop }}%</span>
              <span class="hour-icon">{{ hour.icon }}</span>
              <!-- 막대 위치(hourOffset)는 섭씨 원본으로 계산하고, 글자만 단위 변환한다 -->
              <span class="hour-temp" :style="hourOffset(hour.temp)">{{ t(hour.temp) }}°</span>
            </div>
          </div>
        </div>

        <!-- ③ 주간 예보 (온도 막대) -->
        <div v-if="cityDetail.daily.length" class="panel">
          <div class="panel-title">주간 예보</div>
          <div v-for="day in cityDetail.daily" :key="day.date" class="day-row">
            <span class="day-label">{{ day.label }}</span>
            <span class="day-icon">{{ day.icon }}</span>
            <span v-if="day.pop === null || day.pop === undefined" class="day-pop dim">—</span>
            <span v-else class="day-pop" :class="{ dim: day.pop < 20 }">{{ day.pop }}%</span>
            <span class="day-min">{{ t(day.min) }}°</span>
            <span class="day-track"><i class="day-bar" :style="barStyle(day)"></i></span>
            <span class="day-max">{{ t(day.max) }}°</span>
          </div>
        </div>
      </section>

      <!-- ④ 상세 관측 지표 -->
      <section class="metrics">
        <div class="metric">
          <span class="m-label">체감 온도</span>
          <span class="m-value">{{ t(cityDetail.feelsLike) }}°</span>
        </div>
        <div class="metric">
          <span class="m-label">대기 습도</span>
          <span class="m-value">{{ cityDetail.humidity }}%</span>
        </div>
        <div class="metric">
          <span class="m-label">바람</span>
          <span class="m-value">{{ cityDetail.wind }}<small>m/s</small></span>
        </div>
        <div class="metric">
          <span class="m-label">강수 확률</span>
          <!-- 제공하지 않는 API(MET Norway)일 때는 0% 가 아니라 '—' 로 정직하게 비운다 -->
          <span class="m-value">
            <template v-if="cityDetail.pop === null || cityDetail.pop === undefined">—</template>
            <template v-else>{{ cityDetail.pop }}%</template>
          </span>
        </div>
        <div class="metric">
          <span class="m-label">일출</span>
          <span class="m-value">{{ cityDetail.sunrise }}</span>
        </div>
        <div class="metric">
          <span class="m-label">일몰</span>
          <span class="m-value">{{ cityDetail.sunset }}</span>
        </div>
        <div class="metric">
          <span class="m-label">자외선</span>
          <span class="m-value"
            >{{ cityDetail.uv }}<small>{{ uvLabel }}</small></span
          >
        </div>
        <div class="metric">
          <span class="m-label">관측 지역</span>
          <span class="m-value small">{{ cityDetail.name }}</span>
        </div>
      </section>

      <!-- ⑤ 같은 라우트 안에서 params 만 바꿔 이동 (컴포넌트 재사용 실습) -->
      <section class="quick">
        <span class="quick-label">다른 지역</span>
        <div class="chips">
          <RouterLink
            v-for="item in CITIES"
            :key="item.id"
            :to="`/weather/${item.id}`"
            class="chip"
          >
            {{ item.name }}
          </RouterLink>
        </div>
      </section>
    </template>

    <!-- ═══════ 주소는 맞지만 존재하지 않는 도시 코드 (예: /weather/tokyo) ═══════ -->
    <section v-else class="unknown-city">
      <div class="unknown-icon">🧭</div>
      <p class="unknown-title">
        '<strong>{{ route.params.cityId }}</strong
        >' 관측 정보가 없습니다.
      </p>
      <p class="unknown-sub">등록된 도시 코드는 city_01 ~ city_08 입니다.</p>
      <div class="chips center">
        <RouterLink v-for="item in CITIES" :key="item.id" :to="`/weather/${item.id}`" class="chip">
          {{ item.name }}
        </RouterLink>
      </div>
    </section>

    <div class="actions">
      <button class="primary-btn" type="button" @click="goHome">← 메인 대시보드로 돌아가기</button>
      <button class="ghost-btn" type="button" @click="goBack">⟲ 뒤로 가기 (go(-1))</button>
    </div>

    <p class="route-debug">
      route.path: <code>{{ route.path }}</code> · route.params.cityId:
      <code>{{ route.params.cityId }}</code>
    </p>
  </div>
</template>

<style scoped>
/* ═══════ 상단 하늘 영역 ═══════ */
.sky {
  border-radius: 22px;
  padding: 16px 20px 20px;
  color: #fff;
  box-shadow: 0 12px 30px rgba(20, 50, 90, 0.2);
  margin-bottom: 14px;
}
.sky-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.back-chip {
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 0.78rem;
  cursor: pointer;
}
.back-chip:hover {
  background: rgba(255, 255, 255, 0.24);
}
.live-tag {
  font-size: 0.7rem;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}
.live-tag.off {
  background: rgba(0, 0, 0, 0.18);
}

.sky-city {
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  letter-spacing: -0.5px;
}
.sky-region {
  font-size: 0.78rem;
  opacity: 0.75;
  text-align: center;
}
.sky-temp {
  font-size: 5rem;
  font-weight: 100;
  text-align: center;
  line-height: 1.05;
  letter-spacing: -5px;
  margin-top: 6px;
}
.sky-temp .deg {
  font-weight: 200;
  letter-spacing: 0;
}
.sky-status {
  text-align: center;
  font-size: 1.05rem;
  font-weight: 500;
}
.sky-range {
  text-align: center;
  font-size: 0.85rem;
  opacity: 0.85;
  margin-top: 2px;
}
.sky-comment {
  margin: 12px 0 0;
  font-size: 0.8rem;
  opacity: 0.9;
  text-align: center;
  line-height: 1.5;
}

/* ═══════ 랜드마크 카드 ═══════ */
.landmark-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 14px auto 0;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  backdrop-filter: blur(8px);
  max-width: 280px;
}
.landmark-img {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}
.landmark-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #fff;
  opacity: 0.92;
}

/* ═══════ 패널 (시간별 / 주간) ═══════ */
.panel {
  margin-top: 16px;
  background: rgba(255, 255, 255, 0.13);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 16px;
  padding: 12px 14px;
  backdrop-filter: blur(8px);
}
.panel-title {
  font-size: 0.72rem;
  opacity: 0.75;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.hourly {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.hourly::-webkit-scrollbar {
  height: 4px;
}
.hourly::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}
.hour {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 52px;
  gap: 3px;
}
.hour-label {
  font-size: 0.72rem;
  opacity: 0.85;
  white-space: nowrap;
}
.hour-pop {
  font-size: 0.64rem;
  color: #9ed8ff;
}
.hour-pop.dim {
  opacity: 0;
}
.hour-icon {
  font-size: 1.15rem;
}
.hour-temp {
  font-size: 0.86rem;
  font-weight: 600;
}

/* 주간 예보 행 */
.day-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  font-size: 0.85rem;
}
.day-label {
  width: 30px;
  opacity: 0.9;
}
.day-icon {
  width: 22px;
  text-align: center;
}
.day-pop {
  width: 34px;
  font-size: 0.66rem;
  color: #9ed8ff;
}
.day-pop.dim {
  opacity: 0;
}
.day-min,
.day-max {
  width: 30px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.day-min {
  opacity: 0.7;
}
.day-track {
  flex: 1;
  height: 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.22);
  position: relative;
}
.day-bar {
  position: absolute;
  top: 0;
  height: 4px;
  border-radius: 4px;
  background: linear-gradient(90deg, #7dd3fc, #fbbf24, #fb923c);
  min-width: 6px;
}

/* ═══════ 상세 지표 그리드 ═══════ */
.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}
.metric {
  background: #fff;
  border: 1px solid #e9edf2;
  border-radius: 14px;
  padding: 12px 10px;
  text-align: center;
}
.m-label {
  display: block;
  font-size: 0.7rem;
  color: #9aa4b0;
}
.m-value {
  display: block;
  font-size: 1.15rem;
  font-weight: 600;
  color: #1f2937;
  margin-top: 2px;
}
.m-value.small {
  font-size: 0.95rem;
}
.m-value small {
  display: block;
  font-size: 0.66rem;
  font-weight: 400;
  color: #9aa4b0;
}

/* ═══════ 지역 칩 ═══════ */
.quick {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.quick-label {
  font-size: 0.76rem;
  color: #9aa4b0;
}
.chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.chips.center {
  justify-content: center;
  margin-top: 14px;
}
.chip {
  font-size: 0.78rem;
  padding: 4px 12px;
  border: 1px solid #e5e9ef;
  border-radius: 999px;
  color: #64748b;
  text-decoration: none;
  background: #fff;
}
.chip:hover {
  border-color: #a9cbf0;
  color: #1e88e5;
  background: #f4f9ff;
}
.chip.router-link-exact-active {
  background: #1e88e5;
  border-color: #1e88e5;
  color: #fff;
}

/* ═══════ 없는 도시 ═══════ */
.unknown-city {
  background: #fff;
  border: 1px solid #e9edf2;
  border-radius: 18px;
  padding: 40px 20px;
  text-align: center;
  margin-bottom: 14px;
}
.unknown-icon {
  font-size: 2.4rem;
}
.unknown-title {
  margin: 10px 0 4px;
  color: #1f2937;
}
.unknown-sub {
  margin: 0;
  font-size: 0.82rem;
  color: #9aa4b0;
}

/* ═══════ 하단 버튼 ═══════ */
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.primary-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 999px;
  background: #1f2937;
  color: #fff;
  cursor: pointer;
  font-size: 0.85rem;
}
.primary-btn:hover {
  background: #111827;
}
.ghost-btn {
  padding: 10px 16px;
  border: 1px solid #e5e9ef;
  border-radius: 999px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  font-size: 0.85rem;
}
.ghost-btn:hover {
  background: #f4f7fa;
}
.route-debug {
  margin: 12px 2px 0;
  font-size: 0.74rem;
  color: #b6bec7;
}
.route-debug code {
  background: #f1f4f8;
  padding: 1px 6px;
  border-radius: 4px;
  color: #7b8794;
}

@media (max-width: 560px) {
  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  .sky-temp {
    font-size: 4.2rem;
  }
}
</style>
