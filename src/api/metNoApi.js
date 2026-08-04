/**
 * ══════════════════════════════════════════════════════════════
 *  MET Norway (노르웨이 기상청) 공개 API 모듈
 * ══════════════════════════════════════════════════════════════
 *
 *  왜 이 API 를 추가했나?
 *   - OpenWeatherMap: 새로 발급한 키가 활성화되기 전에는 401 이 뜬다.
 *   - Open-Meteo    : 하루 호출 한도를 넘기면 429 가 뜬다.
 *   → 둘 다 막혔을 때도 '예시 데이터' 대신 진짜 관측값을 보여주려고
 *     키가 필요 없고 한도도 넉넉한 세 번째 실 API 를 넣었다.
 *
 *  문서: https://api.met.no/weatherapi/locationforecast/2.0/documentation
 *  라이선스: 출처(MET Norway)만 밝히면 무료 사용 가능
 *
 *  ⚠️ 이 API 가 주지 않는 값 (거짓말로 채우지 않고 그대로 비워둔다)
 *   - 강수확률(POP): 북유럽 지역에만 제공된다 → 한국은 0 으로 두고
 *                     대신 진짜 강수량(mm)을 그대로 쓴다.
 *   - 체감온도    : 기온·습도·풍속으로 직접 계산한다 (Steadman 식)
 */
import axios from 'axios'

const FORECAST_URL = 'https://api.met.no/weatherapi/locationforecast/2.0'
const SUNRISE_URL = 'https://api.met.no/weatherapi/sunrise/3.0/sun'

const round1 = (v) => Math.round((v ?? 0) * 10) / 10

/* ────────────────────────────────────────────────────────────
 *  symbol_code → 한국어 문구 + 우리 앱의 group
 *  예) 'lightrainshowers_day' → 약한 소나기 / rain / 낮
 * ──────────────────────────────────────────────────────────── */
const GROUP_ICONS = {
  clear: { day: '☀️', night: '🌙' },
  cloud: { day: '⛅️', night: '☁️' },
  rain: { day: '🌦️', night: '🌧️' },
  snow: { day: '🌨️', night: '🌨️' },
  storm: { day: '⛈️', night: '⛈️' },
  fog: { day: '🌫️', night: '🌫️' },
}

const decodeSymbol = (symbolCode, fallbackIsDay = true) => {
  const code = symbolCode ?? ''

  // 접미사로 낮/밤을 알 수 있다. 없으면 호출한 쪽이 알려준 값을 쓴다.
  const isDay = code.endsWith('_night') ? false : code.endsWith('_day') ? true : fallbackIsDay

  const base = code.replace(/_(day|night|polartwilight)$/, '')

  let group = 'cloud'
  let label = '흐림'

  if (base.includes('thunder')) {
    group = 'storm'
    label = '뇌우'
  } else if (base.includes('snow')) {
    group = 'snow'
    label = '눈'
  } else if (base.includes('sleet')) {
    group = 'snow'
    label = '진눈깨비'
  } else if (base.includes('rain')) {
    group = 'rain'
    label = base.includes('showers') ? '소나기' : '비'
  } else if (base === 'fog') {
    group = 'fog'
    label = '안개'
  } else if (base === 'clearsky') {
    group = 'clear'
    label = '맑음'
  } else if (base === 'fair') {
    group = 'clear'
    label = '대체로 맑음'
  } else if (base === 'partlycloudy') {
    group = 'cloud'
    label = '구름 조금'
  } else if (base === 'cloudy') {
    group = 'cloud'
    label = '흐림'
  }

  // 강도 접두사 (눈/비 계열에만 붙는다)
  if (base.startsWith('light')) label = `약한 ${label}`
  else if (base.startsWith('heavy')) label = `강한 ${label}`

  return {
    weatherCode: code,
    status: label,
    group,
    icon: GROUP_ICONS[group][isDay ? 'day' : 'night'],
    isDay,
  }
}

/* ────────────────────────────────────────────────────────────
 *  체감온도 (Steadman 의 Apparent Temperature)
 *  AT = 기온 + 0.33 × 수증기압 − 0.70 × 풍속 − 4.00
 * ──────────────────────────────────────────────────────────── */
const apparentTemp = (tempC, humidity, windMs) => {
  if (tempC === undefined || tempC === null) return 0
  const e = ((humidity ?? 50) / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC))
  return round1(tempC + 0.33 * e - 0.7 * (windMs ?? 0) - 4)
}

/* ────────────────────────────────────────────────────────────
 *  타임존 도우미 — CITIES 의 IANA 이름(Asia/Seoul)만 알면 된다
 * ──────────────────────────────────────────────────────────── */

/** 그 도시의 현지 '시(hour)' 숫자 */
const localHour = (date, timeZone) =>
  Number(
    new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hour12: false }).format(date),
  )

/** 그 도시의 현지 'HH:MM' */
const localHHMM = (date, timeZone) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

/** 그 도시의 현지 날짜 'YYYY-MM-DD' (날짜별로 묶을 때 쓴다) */
const localDate = (date, timeZone) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)

/** Sunrise API 가 요구하는 '+09:00' 형태의 UTC 오프셋 */
const tzOffset = (date, timeZone) => {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')?.value // 'GMT+09:00'
  const offset = name?.replace('GMT', '') ?? '+00:00'
  return offset === '' ? '+00:00' : offset
}

/** 낮인지 판정 — 일출/일몰을 모를 때 쓰는 근사(현지 6~19시) */
const isDaytime = (date, timeZone) => {
  const h = localHour(date, timeZone)
  return h >= 6 && h < 19
}

/** 도시 1곳의 예보 원본 가져오기 */
const fetchRaw = async (city, endpoint = 'compact') => {
  const res = await axios.get(`${FORECAST_URL}/${endpoint}`, {
    params: { lat: city.lat, lon: city.lon },
  })
  return res.data.properties.timeseries ?? []
}

// ══════════════════════════════════════════════════════════════
//  ① 목록용 — 도시 12곳의 현재 날씨
// ══════════════════════════════════════════════════════════════
export const metFetchCurrentWeather = async (cities) => {
  // 도시마다 1회씩, 12개를 동시에 요청한다
  const seriesList = await Promise.all(cities.map((city) => fetchRaw(city, 'compact')))

  return cities.map((city, i) => {
    const series = seriesList[i]
    const now = series[0]
    const d = now?.data?.instant?.details ?? {}
    const nowDate = new Date(now.time)

    const decoded = decodeSymbol(
      now?.data?.next_1_hours?.summary?.symbol_code ??
        now?.data?.next_6_hours?.summary?.symbol_code,
      isDaytime(nowDate, city.timezone),
    )

    // 오늘 하루(현지 날짜 기준)의 최고/최저를 예보 배열에서 직접 뽑는다
    const today = localDate(nowDate, city.timezone)
    const todayTemps = series
      .filter((row) => localDate(new Date(row.time), city.timezone) === today)
      .map((row) => row.data.instant.details.air_temperature)
      .filter((t) => t !== undefined)

    return {
      id: city.id,
      name: city.name,
      englishName: city.englishName,
      countryGroup: city.countryGroup,
      region: city.region,
      lat: city.lat,
      lon: city.lon,
      timezone: city.timezone,
      temp: round1(d.air_temperature),
      // 이중 반올림으로 "현재 32° / 최고 31°" 가 되는 걸 막는다 (openWeatherApi.js 주석 참고)
      tempMax: Math.max(
        Math.round(todayTemps.length ? Math.max(...todayTemps) : d.air_temperature),
        Math.round(round1(d.air_temperature)),
      ),
      tempMin: Math.min(
        Math.round(todayTemps.length ? Math.min(...todayTemps) : d.air_temperature),
        Math.round(round1(d.air_temperature)),
      ),
      humidity: Math.round(d.relative_humidity ?? 0),
      feelsLike: apparentTemp(d.air_temperature, d.relative_humidity, d.wind_speed),
      wind: round1(d.wind_speed),
      windDirection: Math.round(d.wind_from_direction ?? 0),
      precipitation: now?.data?.next_1_hours?.details?.precipitation_amount ?? 0,
      // ⚠️ 강수확률 미제공. 0 으로 채우면 '비 올 일 없음' 이라는 거짓말이 되므로 null 로 비운다.
      pop: null,
      cloudCover: Math.round(d.cloud_area_fraction ?? 0),
      isDay: decoded.isDay,
      isFallback: false,
      source: 'met.no',
      weatherCode: decoded.weatherCode,
      status: decoded.status,
      icon: decoded.icon,
      group: decoded.group,
    }
  })
}

// ══════════════════════════════════════════════════════════════
//  ② 상세용 — 도시 1곳의 현재 + 시간별 + 주간 + 일출/일몰
// ══════════════════════════════════════════════════════════════
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

export const metFetchCityForecast = async (city) => {
  const today = localDate(new Date(), city.timezone)

  const [series, sunRes] = await Promise.all([
    // complete: 이슬점·자외선지수까지 들어있는 상세 버전
    fetchRaw(city, 'complete'),
    axios
      .get(SUNRISE_URL, {
        params: {
          lat: city.lat,
          lon: city.lon,
          date: today,
          offset: tzOffset(new Date(), city.timezone),
        },
      })
      // 일출 API 가 실패해도 본 화면은 살아야 한다
      .catch(() => null),
  ])

  const now = series[0]
  const d = now.data.instant.details
  const nowDate = new Date(now.time)

  const decoded = decodeSymbol(
    now.data.next_1_hours?.summary?.symbol_code ?? now.data.next_6_hours?.summary?.symbol_code,
    isDaytime(nowDate, city.timezone),
  )

  /* ── 시간별: 앞쪽 24개는 1시간 간격이다 ── */
  const hourly = series.slice(0, 24).map((row, i) => {
    const t = new Date(row.time)
    const sym = decodeSymbol(
      row.data.next_1_hours?.summary?.symbol_code ?? row.data.next_6_hours?.summary?.symbol_code,
      isDaytime(t, city.timezone),
    )
    return {
      time: row.time,
      label: i === 0 ? '지금' : `${localHour(t, city.timezone)}시`,
      temp: Math.round(row.data.instant.details.air_temperature),
      pop: null, // 미제공 → 화면에서 강수량(mm)으로 대체 표시된다
      precipitation: row.data.next_1_hours?.details?.precipitation_amount ?? 0,
      isDay: sym.isDay,
      weatherCode: sym.weatherCode,
      status: sym.status,
      icon: sym.icon,
      group: sym.group,
    }
  })

  /* ── 주간: 전체 예보를 현지 날짜별로 접는다 ── */
  const byDate = new Map()
  series.forEach((row) => {
    const key = localDate(new Date(row.time), city.timezone)
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key).push(row)
  })

  const daily = [...byDate.entries()].map(([dateStr, rows], i) => {
    const temps = rows.map((r) => r.data.instant.details.air_temperature).filter((t) => t != null)
    // 그 날의 대표 날씨: 정오에 가장 가까운 예보
    const noon =
      rows.find((r) => localHour(new Date(r.time), city.timezone) === 12) ??
      rows[Math.floor(rows.length / 2)]
    // 주간 행은 '그 날의 요약' 이라 밤 아이콘(🌙)이 나오면 어색하다.
    // _day/_night 접미사를 떼어내고 항상 낮 아이콘으로 그린다.
    const sym = decodeSymbol(
      (
        noon.data.next_6_hours?.summary?.symbol_code ??
        noon.data.next_12_hours?.summary?.symbol_code ??
        noon.data.next_1_hours?.summary?.symbol_code ??
        ''
      ).replace(/_(day|night|polartwilight)$/, ''),
      true,
    )
    return {
      date: dateStr,
      label: i === 0 ? '오늘' : WEEKDAY[new Date(`${dateStr}T00:00:00`).getDay()],
      max: Math.round(Math.max(...temps)),
      min: Math.round(Math.min(...temps)),
      pop: null,
      weatherCode: sym.weatherCode,
      status: sym.status,
      icon: sym.icon,
      group: sym.group,
    }
  })

  /* ── 일출 / 일몰 ── */
  const sunrise = sunRes?.data?.properties?.sunrise?.time
  const sunset = sunRes?.data?.properties?.sunset?.time
  const daylightSec =
    sunrise && sunset ? Math.max(0, (new Date(sunset) - new Date(sunrise)) / 1000) : 0

  return {
    id: city.id,
    name: city.name,
    englishName: city.englishName,
    countryGroup: city.countryGroup,
    region: city.region,
    lat: city.lat,
    lon: city.lon,
    timezone: city.timezone,
    localTime: localHHMM(new Date(), city.timezone),
    temp: round1(d.air_temperature),
    tempMax: daily[0]?.max ?? Math.round(d.air_temperature),
    tempMin: daily[0]?.min ?? Math.round(d.air_temperature),
    humidity: Math.round(d.relative_humidity ?? 0),
    feelsLike: apparentTemp(d.air_temperature, d.relative_humidity, d.wind_speed),
    wind: round1(d.wind_speed),
    windDirection: Math.round(d.wind_from_direction ?? 0),
    pressure: Math.round(d.air_pressure_at_sea_level ?? 1013),
    cloudCover: Math.round(d.cloud_area_fraction ?? 0),
    precipitation: now.data.next_1_hours?.details?.precipitation_amount ?? 0,
    dewPoint: round1(d.dew_point_temperature), // complete 버전은 실측 이슬점을 준다
    visibility: round1(10 - (d.fog_area_fraction ?? 0) / 10), // 가시거리 미제공 → 안개비율로 근사
    uv: Math.round(d.ultraviolet_index_clear_sky ?? 0),
    pop: null, // 미제공 → 화면에 '—' 로 표시된다
    sunrise: sunrise ? localHHMM(new Date(sunrise), city.timezone) : '--:--',
    sunset: sunset ? localHHMM(new Date(sunset), city.timezone) : '--:--',
    daylightText: daylightSec
      ? `${Math.floor(daylightSec / 3600)}시간 ${Math.floor((daylightSec % 3600) / 60)}분`
      : '-',
    sunriseISO: sunrise,
    sunsetISO: sunset,
    isDay: decoded.isDay,
    isFallback: false,
    source: 'met.no',
    updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    weatherCode: decoded.weatherCode,
    status: decoded.status,
    icon: decoded.icon,
    group: decoded.group,
    hourly,
    daily,
  }
}
