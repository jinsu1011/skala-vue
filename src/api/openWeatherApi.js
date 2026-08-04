/**
 * ══════════════════════════════════════════════════════════════
 *  OpenWeatherMap 실시간 날씨 API 모듈 (강의자료 197~199p)
 * ══════════════════════════════════════════════════════════════
 *
 *  Open-Meteo 와 달리 API 키가 반드시 필요하다.
 *   1. https://openweathermap.org 가입 → My API keys 에서 키 확인
 *   2. 프로젝트 루트에 .env.local 파일을 만들고 아래 한 줄을 적는다
 *        VITE_OPENWEATHER_KEY=발급받은키
 *   3. npm run dev 를 다시 실행 (env 파일은 서버 시작 시점에만 읽힌다)
 *
 *  ⚠️ 새로 발급한 키는 활성화까지 최대 2시간 걸린다. 그 전에는 401 이 온다.
 *
 *  무료 플랜: 분당 60회 / 월 100만회 (강의자료 198p)
 *   - /data/2.5/weather  : 현재 날씨 (도시 1곳당 1회)
 *   - /data/2.5/forecast : 3시간 간격 5일 예보 (40건)
 */
import axios from 'axios'

const BASE = 'https://api.openweathermap.org/data/2.5'

export const OWM_KEY = import.meta.env.VITE_OPENWEATHER_KEY ?? ''
export const hasOwmKey = () => OWM_KEY.trim().length > 0

/*
 * OpenWeatherMap 의 condition id → 우리 앱의 group/아이콘으로 번역
 *  2xx 뇌우 / 3xx 이슬비 / 5xx 비 / 6xx 눈 / 7xx 안개·황사 / 800 맑음 / 80x 구름
 *  (Open-Meteo 의 WMO 코드와 체계가 달라서 별도 표가 필요하다)
 */
const owmGroup = (id) => {
  if (id >= 200 && id < 300) return 'storm'
  if (id >= 300 && id < 400) return 'rain'
  if (id >= 500 && id < 600) return 'rain'
  if (id >= 600 && id < 700) return 'snow'
  if (id >= 700 && id < 800) return 'fog'
  if (id === 800) return 'clear'
  if (id === 801 || id === 802) return 'cloud'
  return 'cloud'
}

const ICONS = {
  clear: { day: '☀️', night: '🌙' },
  cloud: { day: '⛅️', night: '☁️' },
  rain: { day: '🌦️', night: '🌧️' },
  snow: { day: '🌨️', night: '🌨️' },
  storm: { day: '⛈️', night: '⛈️' },
  fog: { day: '🌫️', night: '🌫️' },
}

/** OWM 응답 1건 → { status, icon, group, weatherCode } */
const decodeOwm = (weather, isDay = true) => {
  const id = weather?.id ?? 800
  const group = owmGroup(id)
  return {
    weatherCode: id,
    // lang=kr 로 요청했으므로 설명 문구가 이미 한국어로 온다
    status: weather?.description ?? '정보 없음',
    icon: ICONS[group][isDay ? 'day' : 'night'],
    group,
  }
}

const round1 = (v) => Math.round((v ?? 0) * 10) / 10

/** OWM 의 icon 코드는 낮이면 'd', 밤이면 'n' 으로 끝난다 (예: '10d') */
const isDayFrom = (weather) => !String(weather?.icon ?? '01d').endsWith('n')

/**
 * 이슬점 계산 (Magnus 근사식)
 *  OWM 무료 플랜은 이슬점을 주지 않아서 기온·습도로 직접 계산한다.
 */
const dewPointOf = (tempC, humidity) => {
  if (!humidity) return 0
  const a = 17.27
  const b = 237.7
  const alpha = (a * tempC) / (b + tempC) + Math.log(humidity / 100)
  return round1((b * alpha) / (a - alpha))
}

/** UTC 초 + 도시 offset(초) → 그 도시 현지 'HH:MM' */
const localHHMM = (unixSec, offsetSec) => {
  if (!unixSec) return '--:--'
  const d = new Date((unixSec + offsetSec) * 1000)
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

// ══════════════════════════════════════════════════════════════
//  ① 목록용 — 도시 12곳의 현재 날씨
// ══════════════════════════════════════════════════════════════
/**
 * OWM 은 Open-Meteo 처럼 좌표를 콤마로 묶어 한 번에 보낼 수 없다.
 * 도시마다 1회씩, 총 12회를 Promise.all 로 '동시에' 쏜다.
 * (순차로 돌리면 12번 × 200ms = 2.4초, 동시에 쏘면 0.2초)
 */
export const owmFetchCurrentWeather = async (cities) => {
  const requests = cities.map((city) =>
    axios.get(`${BASE}/weather`, {
      params: { lat: city.lat, lon: city.lon, appid: OWM_KEY, units: 'metric', lang: 'kr' },
    }),
  )

  // 강수확률(pop)은 현재 날씨 API 에 없고 예보 API 에만 있다.
  // 지구본 강수 레이어가 쓰는 값이라 예보도 같이 받아온다.
  const popRequests = cities.map((city) =>
    axios
      .get(`${BASE}/forecast`, {
        params: {
          lat: city.lat,
          lon: city.lon,
          appid: OWM_KEY,
          units: 'metric',
          lang: 'kr',
          cnt: 8, // 3시간 × 8 = 24시간치만
        },
      })
      // 예보가 실패해도 목록 전체가 죽으면 안 되니 null 로 흘려보낸다
      .catch(() => null),
  )

  const [currents, forecasts] = await Promise.all([
    Promise.all(requests),
    Promise.all(popRequests),
  ])

  return cities.map((city, i) => {
    const d = currents[i].data
    const weather = d.weather?.[0]
    const isDay = isDayFrom(weather)

    const fc = forecasts[i]?.data?.list ?? []
    // 오늘 하루(24시간)의 최고/최저를 예보에서 뽑는다.
    // OWM 의 current.main.temp_max 는 '같은 시각 도시 내 지점 간 편차'라
    // 일 최고기온과 의미가 다르기 때문이다.
    const temps = fc.map((h) => h.main.temp)
    const dayMax = temps.length ? Math.max(...temps, d.main.temp) : d.main.temp_max
    const dayMin = temps.length ? Math.min(...temps, d.main.temp) : d.main.temp_min

    /*
     * ⚠️ 이중 반올림 주의
     *   현재 기온 31.45℃ → round1 로 31.5 → 화면에서 또 반올림 32
     *   최고 기온 31.45℃ → 그냥 반올림 31
     *   이러면 "현재 32° / 최고 31°" 라는 말이 안 되는 표시가 나온다.
     *   → 화면에 실제로 찍히는 값(shownTemp)을 기준으로 최고/최저를 보정한다.
     */
    const shownTemp = Math.round(round1(d.main.temp))

    return {
      id: city.id,
      name: city.name,
      englishName: city.englishName,
      countryGroup: city.countryGroup,
      region: city.region,
      lat: city.lat,
      lon: city.lon,
      timezone: city.timezone,
      temp: round1(d.main.temp),
      tempMax: Math.max(Math.round(dayMax), shownTemp),
      tempMin: Math.min(Math.round(dayMin), shownTemp),
      humidity: Math.round(d.main.humidity ?? 0),
      feelsLike: round1(d.main.feels_like),
      wind: round1(d.wind?.speed), // units=metric 이라 이미 m/s
      windDirection: d.wind?.deg ?? 0,
      precipitation: d.rain?.['1h'] ?? d.snow?.['1h'] ?? 0,
      pop: Math.round((fc[0]?.pop ?? 0) * 100), // OWM 은 0~1 실수, 화면은 %
      cloudCover: d.clouds?.all ?? 0,
      isDay,
      isFallback: false,
      source: 'openweather',
      ...decodeOwm(weather, isDay),
    }
  })
}

// ══════════════════════════════════════════════════════════════
//  ② 상세용 — 도시 1곳의 현재 + 시간별 + 주간
// ══════════════════════════════════════════════════════════════
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

export const owmFetchCityForecast = async (city) => {
  const common = { lat: city.lat, lon: city.lon, appid: OWM_KEY, units: 'metric', lang: 'kr' }

  const [curRes, fcRes] = await Promise.all([
    axios.get(`${BASE}/weather`, { params: common }),
    axios.get(`${BASE}/forecast`, { params: common }), // 3시간 간격 40건 = 5일
  ])

  const d = curRes.data
  const weather = d.weather?.[0]
  const isDay = isDayFrom(weather)
  const offset = d.timezone ?? 0 // 도시 현지시각 보정값(초)
  const list = fcRes.data.list ?? []

  /* ── 시간별: 무료 플랜은 1시간이 아니라 3시간 간격이다 (5일 = 40건) ── */
  const hourly = list.slice(0, 8).map((h, i) => {
    const hIsDay = isDayFrom(h.weather?.[0])
    const hourStr = String(new Date((h.dt + offset) * 1000).getUTCHours()).padStart(2, '0')
    return {
      time: h.dt_txt,
      label: i === 0 ? '지금' : `${hourStr}시`,
      temp: Math.round(h.main.temp),
      pop: Math.round((h.pop ?? 0) * 100),
      precipitation: h.rain?.['3h'] ?? h.snow?.['3h'] ?? 0,
      isDay: hIsDay,
      ...decodeOwm(h.weather?.[0], hIsDay),
    }
  })

  /* ── 주간: 3시간 단위 40건을 '날짜별'로 접어서 5일치 요약을 만든다 ── */
  const byDate = new Map()
  list.forEach((h) => {
    // 현지 날짜 기준으로 묶어야 시차가 큰 도시(뉴욕 등)에서 하루가 밀리지 않는다
    const localDate = new Date((h.dt + offset) * 1000).toISOString().slice(0, 10)
    if (!byDate.has(localDate)) byDate.set(localDate, [])
    byDate.get(localDate).push(h)
  })

  const daily = [...byDate.entries()].map(([dateStr, rows], i) => {
    const temps = rows.map((r) => r.main.temp)
    // 그 날의 대표 날씨: 정오에 가장 가까운 시각의 값
    const noon =
      rows.find((r) => new Date((r.dt + offset) * 1000).getUTCHours() === 12) ??
      rows[Math.floor(rows.length / 2)]
    return {
      date: dateStr,
      label: i === 0 ? '오늘' : WEEKDAY[new Date(dateStr).getUTCDay()],
      max: Math.round(Math.max(...temps)),
      min: Math.round(Math.min(...temps)),
      pop: Math.round(Math.max(...rows.map((r) => r.pop ?? 0)) * 100),
      weatherCode: noon.weather?.[0]?.id ?? 800,
      ...decodeOwm(noon.weather?.[0], true),
    }
  })

  const sunrise = localHHMM(d.sys?.sunrise, offset)
  const sunset = localHHMM(d.sys?.sunset, offset)
  const daylightSec = Math.max(0, (d.sys?.sunset ?? 0) - (d.sys?.sunrise ?? 0))

  return {
    id: city.id,
    name: city.name,
    englishName: city.englishName,
    countryGroup: city.countryGroup,
    region: city.region,
    lat: city.lat,
    lon: city.lon,
    timezone: city.timezone,
    localTime: localHHMM(d.dt, offset),
    temp: round1(d.main.temp),
    tempMax: daily[0]?.max ?? Math.round(d.main.temp_max),
    tempMin: daily[0]?.min ?? Math.round(d.main.temp_min),
    humidity: Math.round(d.main.humidity ?? 0),
    feelsLike: round1(d.main.feels_like),
    wind: round1(d.wind?.speed),
    windDirection: d.wind?.deg ?? 0,
    pressure: Math.round(d.main.pressure ?? 1013),
    cloudCover: d.clouds?.all ?? 0,
    precipitation: d.rain?.['1h'] ?? d.snow?.['1h'] ?? 0,
    dewPoint: dewPointOf(d.main.temp, d.main.humidity), // 무료 플랜 미제공 → 직접 계산
    visibility: round1((d.visibility ?? 10000) / 1000), // m → km
    uv: 0, // ⚠️ 자외선 지수는 One Call 3.0(유료) 전용이라 무료 키로는 못 받는다
    pop: daily[0]?.pop ?? 0,
    sunrise,
    sunset,
    daylightText: `${Math.floor(daylightSec / 3600)}시간 ${Math.floor((daylightSec % 3600) / 60)}분`,
    sunriseISO: d.sys?.sunrise ? new Date(d.sys.sunrise * 1000).toISOString() : undefined,
    sunsetISO: d.sys?.sunset ? new Date(d.sys.sunset * 1000).toISOString() : undefined,
    isDay,
    isFallback: false,
    source: 'openweather',
    updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    ...decodeOwm(weather, isDay),
    hourly,
    daily,
  }
}
