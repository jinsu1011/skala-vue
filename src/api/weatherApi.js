/**
 * ══════════════════════════════════════════════════════════════
 *  날씨 API 모듈 — 실제 API 2개를 이중화해서 쓴다
 * ══════════════════════════════════════════════════════════════
 *
 *  1순위 OpenWeatherMap (강의자료 197~199p)
 *    - 과제에서 지정한 API. 키가 필요하다 (.env.local 의 VITE_OPENWEATHER_KEY)
 *    - 무료 분당 60회 / 월 100만회 → 실습 중에 한도가 찰 일이 거의 없다
 *
 *  2순위 Open-Meteo
 *    - 키가 없어도 되는 대신 '하루 호출 한도' 가 있어서
 *      많이 쓰면 429(Daily API request limit exceeded) 가 뜬다.
 *      → 이때 화면이 '예시 데이터' 로 떨어지던 원인이었다.
 *
 *  3순위 MET Norway (노르웨이 기상청)
 *    - 키도 없고 한도도 넉넉한 최후의 실 API.
 *
 *  셋 다 실패해야 비로소 FALLBACK_WEATHER(예시값) 를 쓴다.
 */
import { hasOwmKey, owmFetchCurrentWeather, owmFetchCityForecast } from '@/api/openWeatherApi'
import { metFetchCurrentWeather, metFetchCityForecast } from '@/api/metNoApi'

const API_URL = 'https://api.open-meteo.com/v1/forecast'

// 11개 도시 정보 (국내 3개 + 해외 8개)
export const CITIES = [
  {
    id: 'city_01',
    name: '서울',
    englishName: 'Seoul',
    countryGroup: 'KR',
    region: '대한민국 서울특별시',
    lat: 37.5665,
    lon: 126.978,
    timezone: 'Asia/Seoul',
  },
  {
    id: 'city_07',
    name: '부산',
    englishName: 'Busan',
    countryGroup: 'KR',
    region: '대한민국 부산광역시',
    lat: 35.1796,
    lon: 129.0756,
    timezone: 'Asia/Seoul',
  },
  {
    id: 'city_08',
    name: '제주',
    englishName: 'Jeju',
    countryGroup: 'KR',
    region: '대한민국 제주특별자치도',
    lat: 33.4996,
    lon: 126.5312,
    timezone: 'Asia/Seoul',
  },
  {
    id: 'city_09',
    name: '뉴욕',
    englishName: 'New York',
    countryGroup: 'INT',
    region: '미국 뉴욕',
    lat: 40.7128,
    lon: -74.006,
    timezone: 'America/New_York',
    aliases: ['ny', 'new york', '뉴욕'],
  },
  {
    id: 'city_10',
    name: '도쿄',
    englishName: 'Tokyo',
    countryGroup: 'INT',
    region: '일본 도쿄',
    lat: 35.6762,
    lon: 139.6503,
    timezone: 'Asia/Tokyo',
    aliases: ['tokyo', '도쿄', '동경'],
  },
  {
    id: 'city_11',
    name: '런던',
    englishName: 'London',
    countryGroup: 'INT',
    region: '영국 런던',
    lat: 51.5074,
    lon: -0.1278,
    timezone: 'Europe/London',
    aliases: ['london', '런던'],
  },
  {
    id: 'city_12',
    name: '파리',
    englishName: 'Paris',
    countryGroup: 'INT',
    region: '프랑스 파리',
    lat: 48.8566,
    lon: 2.3522,
    timezone: 'Europe/Paris',
    aliases: ['paris', '파리'],
  },
  {
    id: 'city_13',
    name: '베이징',
    englishName: 'Beijing',
    countryGroup: 'INT',
    region: '중국 베이징',
    lat: 39.9042,
    lon: 116.4074,
    timezone: 'Asia/Shanghai',
    aliases: ['beijing', '베이징', '북경'],
  },
  {
    id: 'city_14',
    name: '모스크바',
    englishName: 'Moscow',
    countryGroup: 'INT',
    region: '러시아 모스크바',
    lat: 55.7558,
    lon: 37.6173,
    timezone: 'Europe/Moscow',
    aliases: ['moscow', '모스크바'],
  },
  {
    id: 'city_15',
    name: '마드리드',
    englishName: 'Madrid',
    countryGroup: 'INT',
    region: '스페인 마드리드',
    lat: 40.4168,
    lon: -3.7038,
    timezone: 'Europe/Madrid',
    aliases: ['madrid', '마드리드'],
  },
  {
    id: 'city_16',
    name: '로스앤젤레스',
    englishName: 'Los Angeles',
    countryGroup: 'INT',
    region: '미국 로스앤젤레스',
    lat: 34.0522,
    lon: -118.2437,
    timezone: 'America/Los_Angeles',
    aliases: ['la', 'los angeles', '로스앤젤레스', '엘에이'],
  },
  {
    id: 'city_17',
    name: '로마',
    englishName: 'Rome',
    countryGroup: 'INT',
    region: '이탈리아 로마 (피사의 사탑)',
    lat: 41.9028,
    lon: 12.4964,
    timezone: 'Europe/Rome',
    aliases: ['rome', '로마', '이탈리아', '피사', '피사의 사탑', 'italy'],
  },
  {
    id: 'city_18',
    name: '카이로',
    englishName: 'Cairo',
    countryGroup: 'INT',
    region: '이집트 카이로 (피라미드)',
    lat: 30.0444,
    lon: 31.2357,
    timezone: 'Africa/Cairo',
    aliases: ['cairo', '카이로', '이집트', '피라미드', 'egypt', 'pyramid'],
  },
  {
    id: 'city_19',
    name: '카트만두',
    englishName: 'Kathmandu',
    countryGroup: 'INT',
    region: '네팔 카트만두 (에베레스트)',
    lat: 27.7172,
    lon: 85.324,
    timezone: 'Asia/Kathmandu',
    aliases: ['kathmandu', '카트만두', '네팔', '에베레스트', 'nepal', 'everest'],
  },
  {
    id: 'city_20',
    name: '캔버라',
    englishName: 'Canberra',
    countryGroup: 'INT',
    region: '호주 캔버라 (쿼카)',
    lat: -35.2809,
    lon: 149.13,
    timezone: 'Australia/Sydney',
    aliases: ['canberra', '캔버라', '호주', '쿼카', 'australia', 'quokka'],
  },
  {
    id: 'city_21',
    name: '리우',
    englishName: 'Rio de Janeiro',
    countryGroup: 'INT',
    region: '브라질 리우데자네이루 (예수상)',
    lat: -22.9068,
    lon: -43.1729,
    timezone: 'America/Sao_Paulo',
    aliases: ['rio de janeiro', 'rio', '리우', '리우데자네이루', '브라질', '예수상', 'brazil'],
  },
  {
    id: 'city_22',
    name: '남극',
    englishName: 'Antarctica',
    countryGroup: 'INT',
    region: '남극 대륙 (펭귄 서식지)',
    lat: -77.8463,
    lon: 166.6682,
    timezone: 'Antarctica/McMurdo',
    aliases: ['antarctica', '남극', '펭귄', 'penguin', 'south pole'],
  },
  {
    id: 'city_23',
    name: '북극',
    englishName: 'Arctic',
    countryGroup: 'INT',
    region: '북극권 (스발바르 북극곰 서식지)',
    lat: 78.2232,
    lon: 15.6267,
    timezone: 'Arctic/Longyearbyen',
    aliases: ['arctic', '북극', '북극곰', 'polar bear', 'svalbard', '스발바르', 'north pole'],
  },
]

/**
 * WMO 기상 코드 변환표
 */
const WMO_TABLE = {
  0: { label: '맑음', icon: '☀️', nightIcon: '🌙', group: 'clear' },
  1: { label: '대체로 맑음', icon: '🌤️', nightIcon: '🌙', group: 'clear' },
  2: { label: '구름 조금', icon: '⛅️', nightIcon: '☁️', group: 'cloud' },
  3: { label: '흐림', icon: '☁️', nightIcon: '☁️', group: 'cloud' },
  45: { label: '안개', icon: '🌫️', nightIcon: '🌫️', group: 'fog' },
  48: { label: '짙은 안개', icon: '🌫️', nightIcon: '🌫️', group: 'fog' },
  51: { label: '약한 이슬비', icon: '🌦️', nightIcon: '🌧️', group: 'rain' },
  53: { label: '이슬비', icon: '🌦️', nightIcon: '🌧️', group: 'rain' },
  55: { label: '강한 이슬비', icon: '🌧️', nightIcon: '🌧️', group: 'rain' },
  56: { label: '어는 이슬비', icon: '🌧️', nightIcon: '🌧️', group: 'rain' },
  57: { label: '어는 이슬비', icon: '🌧️', nightIcon: '🌧️', group: 'rain' },
  61: { label: '약한 비', icon: '🌦️', nightIcon: '🌧️', group: 'rain' },
  63: { label: '비', icon: '🌧️', nightIcon: '🌧️', group: 'rain' },
  65: { label: '강한 비', icon: '🌧️', nightIcon: '🌧️', group: 'rain' },
  66: { label: '어는 비', icon: '🌧️', nightIcon: '🌧️', group: 'rain' },
  67: { label: '어는 비', icon: '🌧️', nightIcon: '🌧️', group: 'rain' },
  71: { label: '약한 눈', icon: '🌨️', nightIcon: '🌨️', group: 'snow' },
  73: { label: '눈', icon: '🌨️', nightIcon: '🌨️', group: 'snow' },
  75: { label: '강한 눈', icon: '❄️', nightIcon: '❄️', group: 'snow' },
  77: { label: '싸락눈', icon: '🌨️', nightIcon: '🌨️', group: 'snow' },
  80: { label: '소나기', icon: '🌦️', nightIcon: '🌧️', group: 'rain' },
  81: { label: '소나기', icon: '🌧️', nightIcon: '🌧️', group: 'rain' },
  82: { label: '강한 소나기', icon: '⛈️', nightIcon: '⛈️', group: 'rain' },
  85: { label: '소낙눈', icon: '🌨️', nightIcon: '🌨️', group: 'snow' },
  86: { label: '강한 소낙눈', icon: '❄️', nightIcon: '❄️', group: 'snow' },
  95: { label: '뇌우', icon: '⛈️', nightIcon: '⛈️', group: 'storm' },
  96: { label: '우박 동반 뇌우', icon: '⛈️', nightIcon: '⛈️', group: 'storm' },
  99: { label: '우박 동반 뇌우', icon: '⛈️', nightIcon: '⛈️', group: 'storm' },
}

const UNKNOWN = { label: '정보 없음', icon: '🌡️', nightIcon: '🌡️', group: 'cloud' }

export const decodeWeather = (code, isDay = true) => {
  const found = WMO_TABLE[code] ?? UNKNOWN
  return {
    weatherCode: code,
    status: found.label,
    icon: isDay ? found.icon : found.nightIcon,
    group: found.group,
  }
}

const GRADIENTS = {
  clear: [
    'linear-gradient(175deg,#3d8fd4 0%,#5eaee6 45%,#9ed3f0 100%)',
    'linear-gradient(175deg,#16244a 0%,#223463 50%,#3a5183 100%)',
  ],
  cloud: [
    'linear-gradient(175deg,#63819f 0%,#8aa2ba 50%,#b3c5d4 100%)',
    'linear-gradient(175deg,#232d3c 0%,#354254 50%,#4f5f74 100%)',
  ],
  rain: [
    'linear-gradient(175deg,#44596c 0%,#61798e 50%,#8aa1b3 100%)',
    'linear-gradient(175deg,#19212b 0%,#293744 50%,#405161 100%)',
  ],
  snow: [
    'linear-gradient(175deg,#748ca4 0%,#9db2c6 50%,#cbd9e5 100%)',
    'linear-gradient(175deg,#242d3a 0%,#374556 50%,#57687c 100%)',
  ],
  storm: [
    'linear-gradient(175deg,#2f3a49 0%,#455263 50%,#606f85 100%)',
    'linear-gradient(175deg,#11161d 0%,#1e2632 50%,#313c4a 100%)',
  ],
  fog: [
    'linear-gradient(175deg,#78848f 0%,#98a5b1 50%,#c0cad3 100%)',
    'linear-gradient(175deg,#212730 0%,#333a44 50%,#4a535e 100%)',
  ],
}

export const weatherGradient = (group, isDay = true) => {
  const pair = GRADIENTS[group] ?? GRADIENTS.cloud
  return isDay ? pair[0] : pair[1]
}

// 오프라인/오류 시 목(Mock) 데이터
export const FALLBACK_WEATHER = CITIES.map((city, i) => {
  const seedList = [
    { temp: 28, code: 0 },
    { temp: 27, code: 1 },
    { temp: 26, code: 2 },
    { temp: 25, code: 3 },
    { temp: 29, code: 0 },
    { temp: 30, code: 1 },
    { temp: 27, code: 63 },
    { temp: 26, code: 80 },
    { temp: 22, code: 3 },
    { temp: 28, code: 0 },
    { temp: 19, code: 61 },
    { temp: 24, code: 2 },
    { temp: 25, code: 1 },
    { temp: 15, code: 3 },
    { temp: 23, code: 0 },
    { temp: 26, code: 0 },
  ]
  const seed = seedList[i % seedList.length]
  return {
    id: city.id,
    name: city.name,
    englishName: city.englishName,
    region: city.region,
    lat: city.lat,
    lon: city.lon,
    timezone: city.timezone,
    temp: seed.temp,
    tempMax: seed.temp + 3,
    tempMin: seed.temp - 4,
    humidity: 60,
    feelsLike: seed.temp + 1,
    wind: 3.2,
    windDirection: 180,
    isDay: true,
    isFallback: true,
    ...decodeWeather(seed.code, true),
  }
})

const toArray = (data) => (Array.isArray(data) ? data : [data])
const round1 = (v) => Math.round((v ?? 0) * 10) / 10

/**
 * 12개 도시의 현재 기온 및 날씨 정보 (콤마 구분 다중 좌표 한 번에 호출)
 */
const meteoFetchCurrentWeather = async () => {
  const params = new URLSearchParams({
    latitude: CITIES.map((c) => c.lat).join(','),
    longitude: CITIES.map((c) => c.lon).join(','),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,is_day',
    daily: 'temperature_2m_max,temperature_2m_min',
    // 강수확률은 current에 없고 hourly에만 있습니다.
    // forecast_hours=1 로 "지금 이 시각" 1개만 받아 지구본 강수 레이어에 씁니다.
    hourly: 'precipitation_probability',
    forecast_hours: '1',
    forecast_days: '1',
    timezone: 'auto',
    // Open-Meteo의 풍속 기본 단위는 km/h입니다.
    // 화면에는 'm/s'로 표기하고 있으므로 응답 단위 자체를 m/s로 맞춥니다.
    wind_speed_unit: 'ms',
  })

  const res = await fetch(`${API_URL}?${params}`)
  if (!res.ok) throw new Error(`날씨 API 응답 오류: ${res.status}`)

  const list = toArray(await res.json())

  return CITIES.map((city, index) => {
    const current = list[index]?.current
    const daily = list[index]?.daily
    const isDay = current?.is_day === 1

    return {
      id: city.id,
      name: city.name,
      englishName: city.englishName,
      countryGroup: city.countryGroup,
      region: city.region,
      lat: city.lat,
      lon: city.lon,
      timezone: city.timezone,
      temp: round1(current?.temperature_2m),
      tempMax: Math.round(daily?.temperature_2m_max?.[0] ?? 0),
      tempMin: Math.round(daily?.temperature_2m_min?.[0] ?? 0),
      humidity: Math.round(current?.relative_humidity_2m ?? 0),
      feelsLike: round1(current?.apparent_temperature),
      wind: round1(current?.wind_speed_10m),
      windDirection: current?.wind_direction_10m ?? 0,
      precipitation: current?.precipitation ?? 0,
      // 지구본 기상 레이어가 사용하는 값들
      pop: list[index]?.hourly?.precipitation_probability?.[0] ?? 0, // 강수확률(%)
      cloudCover: current?.cloud_cover ?? 0, // 운량(%)
      isDay,
      isFallback: false,
      source: 'open-meteo',
      ...decodeWeather(current?.weather_code, isDay),
    }
  })
}

/**
 * ★ 화면이 실제로 호출하는 함수 — OpenWeatherMap 을 먼저 시도한다.
 *   키가 없거나 OWM 이 실패하면 Open-Meteo 로 자동 전환한다.
 */
export const fetchCurrentWeather = async () => {
  if (hasOwmKey()) {
    try {
      return await owmFetchCurrentWeather(CITIES)
    } catch (error) {
      console.warn('⚠️ OpenWeatherMap 실패 → Open-Meteo 로 전환:', describeApiError(error))
    }
  }

  try {
    return await meteoFetchCurrentWeather()
  } catch (error) {
    console.warn('⚠️ Open-Meteo 실패 → MET Norway 로 전환:', describeApiError(error))
  }

  return metFetchCurrentWeather(CITIES)
}

/** 통신 에러를 사람이 읽을 수 있는 한 줄로 바꾼다 */
export const describeApiError = (error) => {
  const status = error?.response?.status
  if (status === 401) return 'OpenWeatherMap 키가 잘못됐거나 아직 활성화 전입니다 (401)'
  if (status === 429) return '오늘 API 호출 한도를 초과했습니다 (429)'
  if (status) return `API 응답 오류 ${status}`
  return error?.message ?? '알 수 없는 오류'
}

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

/**
 * 타임존 반영 현지 시각 문자열
 */
export const getLocalTimeString = (timezone) => {
  try {
    return new Date().toLocaleTimeString('ko-KR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return '--:--'
  }
}

/**
 * 특정 도시 1곳의 현재 + 시간별(24h) + 주간(10일) 상세 예보
 */
export const fetchCityForecast = async (cityId) => {
  const city = CITIES.find((c) => c.id === cityId)
  if (!city) return null

  // 목록과 똑같은 순서: OpenWeatherMap → Open-Meteo → MET Norway
  if (hasOwmKey()) {
    try {
      return await owmFetchCityForecast(city)
    } catch (error) {
      console.warn('⚠️ OpenWeatherMap 상세 실패 → Open-Meteo 로 전환:', describeApiError(error))
    }
  }

  try {
    return await meteoFetchCityForecast(city)
  } catch (error) {
    console.warn('⚠️ Open-Meteo 상세 실패 → MET Norway 로 전환:', describeApiError(error))
    return metFetchCityForecast(city)
  }
}

/** Open-Meteo 로 도시 1곳의 상세 예보를 받아온다 */
const meteoFetchCityForecast = async (city) => {
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m',
    hourly:
      'temperature_2m,precipitation_probability,precipitation,weather_code,visibility,dew_point_2m,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_probability_max,wind_speed_10m_max',
    timezone: 'auto',
    forecast_days: '10',
    wind_speed_unit: 'ms', // 화면 표기(m/s)와 단위를 일치시킵니다
  })

  const res = await fetch(`${API_URL}?${params}`)
  if (!res.ok) throw new Error(`날씨 API 응답 오류: ${res.status}`)

  const data = await res.json()
  const current = data.current
  const isDay = current?.is_day === 1

  // 시간별 예보: 현재 타임존 시각 기준 24개 잘라 쓰기
  const times = data.hourly?.time ?? []
  const nowIndex = Math.max(
    0,
    times.findIndex((t) => new Date(t).getTime() >= new Date(current.time).getTime()),
  )

  const hourly = times.slice(nowIndex, nowIndex + 24).map((timeStr, i) => {
    const idx = nowIndex + i
    const hourIsDay = data.hourly.is_day?.[idx] === 1
    const hourDate = new Date(timeStr)
    // formatToParts로 "시" 같은 locale 표기를 뺀 순수 숫자만 뽑습니다.
    // (ko-KR로 그냥 포맷하면 "13시"가 나와 뒤에 '시'를 붙일 때 "13시시"가 됩니다)
    const formattedHour =
      new Intl.DateTimeFormat('ko-KR', {
        timeZone: data.timezone || city.timezone,
        hour: 'numeric',
        hour12: false,
      })
        .formatToParts(hourDate)
        .find((part) => part.type === 'hour')?.value ?? '--'

    return {
      time: timeStr,
      label: i === 0 ? '지금' : `${formattedHour}시`,
      temp: Math.round(data.hourly.temperature_2m[idx]),
      pop: data.hourly.precipitation_probability?.[idx] ?? 0,
      precipitation: data.hourly.precipitation?.[idx] ?? 0,
      isDay: hourIsDay,
      ...decodeWeather(data.hourly.weather_code[idx], hourIsDay),
    }
  })

  // 주간 예보 10일
  const dailyTimes = data.daily?.time ?? []
  const daily = dailyTimes.map((dateStr, i) => {
    const d = new Date(dateStr)
    const dayLabel = i === 0 ? '오늘' : WEEKDAY[d.getDay()]
    return {
      date: dateStr,
      label: dayLabel,
      max: Math.round(data.daily.temperature_2m_max[i]),
      min: Math.round(data.daily.temperature_2m_min[i]),
      pop: data.daily.precipitation_probability_max?.[i] ?? 0,
      weatherCode: data.daily.weather_code[i],
      ...decodeWeather(data.daily.weather_code[i], true),
    }
  })

  const formatISOToLocalTime = (iso) => {
    if (!iso) return '--:--'
    try {
      return new Date(iso).toLocaleTimeString('ko-KR', {
        timeZone: data.timezone || city.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    } catch {
      return '--:--'
    }
  }

  // 일출/일몰 및 낮 길이 (분)
  const sunriseStr = formatISOToLocalTime(data.daily?.sunrise?.[0])
  const sunsetStr = formatISOToLocalTime(data.daily?.sunset?.[0])
  const daylightDurationSec = data.daily?.daylight_duration?.[0] ?? 0
  const daylightHours = Math.floor(daylightDurationSec / 3600)
  const daylightMinutes = Math.floor((daylightDurationSec % 3600) / 60)

  return {
    id: city.id,
    name: city.name,
    englishName: city.englishName,
    countryGroup: city.countryGroup,
    region: city.region,
    lat: city.lat,
    lon: city.lon,
    timezone: data.timezone || city.timezone,
    localTime: getLocalTimeString(data.timezone || city.timezone),
    temp: round1(current?.temperature_2m),
    tempMax: daily[0]?.max ?? 0,
    tempMin: daily[0]?.min ?? 0,
    humidity: Math.round(current?.relative_humidity_2m ?? 0),
    feelsLike: round1(current?.apparent_temperature),
    wind: round1(current?.wind_speed_10m),
    windDirection: current?.wind_direction_10m ?? 0,
    pressure: Math.round(current?.pressure_msl ?? current?.surface_pressure ?? 1013),
    cloudCover: current?.cloud_cover ?? 0,
    precipitation: current?.precipitation ?? 0,
    dewPoint: round1(data.hourly?.dew_point_2m?.[nowIndex] ?? 0),
    visibility: round1((data.hourly?.visibility?.[nowIndex] ?? 10000) / 1000), // km
    uv: Math.round(data.daily?.uv_index_max?.[0] ?? 0),
    pop: daily[0]?.pop ?? 0,
    sunrise: sunriseStr,
    sunset: sunsetStr,
    daylightText: `${daylightHours}시간 ${daylightMinutes}분`,
    sunriseISO: data.daily?.sunrise?.[0],
    sunsetISO: data.daily?.sunset?.[0],
    isDay,
    isFallback: false,
    source: 'open-meteo',
    updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    ...decodeWeather(current?.weather_code, isDay),
    hourly,
    daily,
  }
}
