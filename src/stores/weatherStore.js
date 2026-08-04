import { defineStore } from 'pinia'
import { CITIES, fetchCurrentWeather, fetchCityForecast, FALLBACK_WEATHER } from '@/api/weatherApi'

/**
 * localStorage 저장 키
 *
 * localStorage는 브라우저에 문자열(String)만 저장할 수 있는 저장소입니다.
 * 새로고침을 하거나 브라우저를 껐다 켜도 값이 남아있기 때문에
 * "즐겨찾기" 처럼 사용자별로 계속 기억해야 하는 값을 담기에 알맞습니다.
 */
const FAVORITES_KEY = 'skala-weather-favorites'

/**
 * localStorage에서 즐겨찾기 목록을 읽어옵니다.
 *
 * try/catch로 감싼 이유:
 * 1) 사파리 시크릿 모드 등에서는 localStorage 접근 자체가 예외를 던질 수 있고
 * 2) 사용자가 값을 직접 손으로 고쳐 깨진 JSON이 들어있을 수도 있습니다.
 * 이때 앱 전체가 죽으면 안 되므로 실패 시 빈 배열로 안전하게 되돌립니다.
 */
const loadFavorites = () => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // 앱에 실제로 존재하는 도시 ID만 남깁니다 (삭제된 도시 ID 방어)
    return parsed.filter((id) => CITIES.some((c) => c.id === id))
  } catch (err) {
    console.warn('즐겨찾기 불러오기 실패:', err)
    return []
  }
}

/** 즐겨찾기 목록을 localStorage에 문자열(JSON)로 저장합니다. */
const saveFavorites = (ids) => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
  } catch (err) {
    console.warn('즐겨찾기 저장 실패:', err)
  }
}

/**
 * 🌍 날씨 앱 전역 스토어 (Pinia)
 *
 * 사용 이유:
 * 지구본 Stage, 상단 검색바, Leaflet 지도, 상세 날씨 패널이 모두 '선택된 도시'와
 * '날씨 데이터'를 공유해야 합니다. Pinia를 사용하지 않고 props/emits로 전달하려면
 * 최상위 루트 View에서 하위 컴포넌트로 3~4단계 넘기는 'Prop Drilling' 지옥이 발생합니다.
 * 스토어를 통해 중앙 집중식으로 데이터를 전달하고 관리합니다.
 */
export const useWeatherStore = defineStore('weather', {
  state: () => ({
    // 12개 도시 전체 날씨 개요 목록
    citiesWeather: [],
    // 현재 선택된 도시 ID (null 이면 idle 상태)
    selectedCityId: null,
    // 선택된 도시의 상세 날씨 데이터 (현재 + 24시간 + 10일)
    selectedCityWeather: null,
    // 지구본 및 화면 전환 상태 ('idle' | 'flying' | 'focused')
    viewState: 'idle',
    // 기온 단위 ('C' | 'F')
    unit: 'C',
    // 데이터 로딩 중 여부
    loadingCurrent: false,
    loadingDetail: false,
    // API 장애/오프라인 시 예시 데이터(Fallback) 사용 여부
    isFallback: false,
    // ⭐ 즐겨찾기한 도시 ID 배열 (앱 시작 시 localStorage에서 복원)
    favoriteCityIds: loadFavorites(),
    // 🛰️ 지구본 위 기상 오버레이 레이어 ('none' | 'cloud' | 'rain' | 'temp')
    weatherLayer: 'cloud',
  }),

  getters: {
    // 현재 선택된 도시 객체 정보 (CITIES 기준)
    selectedCityInfo: (state) => {
      if (!state.selectedCityId) return null
      return CITIES.find((c) => c.id === state.selectedCityId) || null
    },

    // 단위 변환 함수 (섭씨 °C ↔ 화씨 °F)
    convertTemp: (state) => (tempC) => {
      if (tempC === null || tempC === undefined) return 0
      if (state.unit === 'F') {
        return Math.round((tempC * 9) / 5 + 32)
      }
      return Math.round(tempC)
    },

    // 기온 단위 기호
    unitSymbol: (state) => `°${state.unit}`,

    /**
     * 특정 도시가 즐겨찾기인지 확인 (getter가 "함수"를 반환하는 패턴)
     * 사용법: weatherStore.isFavorite('city_01')
     */
    isFavorite: (state) => (cityId) => state.favoriteCityIds.includes(cityId),

    /**
     * 즐겨찾기 도시들의 "날씨 정보가 포함된" 목록
     * favoriteCityIds(문자열 배열)를 실제 화면에 그릴 수 있는 객체 배열로 바꿔줍니다.
     * 아직 날씨 API가 로드되기 전이라면 CITIES의 기본 정보만이라도 채워 넣습니다.
     */
    favoriteCities: (state) =>
      state.favoriteCityIds
        .map((id) => {
          const weather = state.citiesWeather.find((c) => c.id === id)
          if (weather) return weather
          const city = CITIES.find((c) => c.id === id)
          return city ? { ...city, temp: null, icon: '🌡️', status: '불러오는 중' } : null
        })
        .filter(Boolean),
  },

  actions: {
    /**
     * 12개 도시의 현재 기온/날씨 요약 정보 로드
     */
    async fetchAllCitiesWeather() {
      this.loadingCurrent = true
      try {
        const data = await fetchCurrentWeather()
        this.citiesWeather = data
        this.isFallback = false
      } catch (err) {
        console.warn('전체 도시 날씨 가져오기 실패, Mock 데이터를 사용합니다.', err)
        this.citiesWeather = FALLBACK_WEATHER
        this.isFallback = true
      } finally {
        this.loadingCurrent = false
      }
    },

    /**
     * 특정 도시 선택 및 상세 날씨 데이터 로드
     */
    async selectCity(cityId) {
      if (!cityId) {
        this.selectedCityId = null
        this.selectedCityWeather = null
        this.viewState = 'idle'
        return
      }

      this.selectedCityId = cityId
      this.loadingDetail = true

      try {
        const detail = await fetchCityForecast(cityId)
        if (detail) {
          this.selectedCityWeather = detail
        } else {
          // 도시를 찾지 못했거나 에러 발생 시
          this.selectedCityWeather = this.getFallbackDetail(cityId)
          this.isFallback = true
        }
      } catch (err) {
        console.warn(`${cityId} 상세 날씨 로드 실패, Fallback 사용합니다.`, err)
        this.selectedCityWeather = this.getFallbackDetail(cityId)
        this.isFallback = true
      } finally {
        this.loadingDetail = false
      }
    },

    /**
     * 화면/지구본 뷰 상태 변경 ('idle' | 'flying' | 'focused')
     */
    setViewState(state) {
      this.viewState = state
    },

    /**
     * 섭씨/화씨 토글
     */
    toggleUnit() {
      this.unit = this.unit === 'C' ? 'F' : 'C'
    },

    /**
     * ⭐ 즐겨찾기 추가/해제 (토글)
     *
     * 배열을 직접 push/splice 하지 않고 "새 배열"로 갈아끼우는 이유:
     * Vue의 반응형은 배열 변경도 감지하지만, 새 배열을 대입하는 방식이
     * 의도가 더 명확하고 실수(중복 추가 등)를 막기 쉽습니다.
     */
    toggleFavorite(cityId) {
      if (!cityId) return

      if (this.favoriteCityIds.includes(cityId)) {
        this.favoriteCityIds = this.favoriteCityIds.filter((id) => id !== cityId)
      } else {
        this.favoriteCityIds = [...this.favoriteCityIds, cityId]
      }

      // 상태가 바뀔 때마다 즉시 localStorage에 동기화 → 새로고침해도 유지
      saveFavorites(this.favoriteCityIds)
    },

    /**
     * 즐겨찾기 전체 비우기
     */
    clearFavorites() {
      this.favoriteCityIds = []
      saveFavorites(this.favoriteCityIds)
    },

    /**
     * 🛰️ 지구본 기상 오버레이 레이어 변경
     * 같은 버튼을 다시 누르면 꺼지도록(토글) 처리합니다.
     */
    setWeatherLayer(layer) {
      this.weatherLayer = this.weatherLayer === layer ? 'none' : layer
    },

    /**
     * 상세 날씨 데이터 폴백 객체 생성
     */
    getFallbackDetail(cityId) {
      const fallbackOverview = FALLBACK_WEATHER.find((f) => f.id === cityId) || FALLBACK_WEATHER[0]

      const mockHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        label: i === 0 ? '지금' : `${i}시`,
        temp: fallbackOverview.temp + Math.floor(Math.sin(i / 3) * 3),
        pop: 10,
        precipitation: 0,
        weatherCode: fallbackOverview.weatherCode,
        status: fallbackOverview.status,
        icon: fallbackOverview.icon,
        group: fallbackOverview.group,
        isDay: i >= 6 && i <= 19,
      }))

      const mockDaily = Array.from({ length: 10 }, (_, i) => ({
        date: `2026-08-0${i + 1}`,
        label: i === 0 ? '오늘' : ['월', '화', '수', '목', '금', '토', '일'][i % 7],
        max: fallbackOverview.temp + 2,
        min: fallbackOverview.temp - 3,
        pop: 20,
        weatherCode: fallbackOverview.weatherCode,
        status: fallbackOverview.status,
        icon: fallbackOverview.icon,
        group: fallbackOverview.group,
      }))

      return {
        ...fallbackOverview,
        localTime: '12:00',
        pressure: 1013,
        cloudCover: 20,
        precipitation: 0,
        dewPoint: 18,
        visibility: 10,
        uv: 5,
        pop: 20,
        sunrise: '05:35',
        sunset: '19:40',
        daylightText: '14시간 5분',
        updatedAt: '12:00',
        hourly: mockHourly,
        daily: mockDaily,
        isFallback: true,
      }
    },
  },
})
