/**
 * Open-Meteo 실시간 날씨 API 모듈
 *
 * - API 키가 필요 없다 → Public 저장소에 올려도 노출될 비밀값이 없음
 * - CORS 허용 → 브라우저에서 fetch 로 직접 호출 가능
 * - 문서: https://open-meteo.com/en/docs
 */

const API_URL = 'https://api.open-meteo.com/v1/forecast'

// 12개 도시 정보 (국내 8개 + 해외 4개)
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
    id: 'city_02',
    name: '인천',
    englishName: 'Incheon',
    countryGroup: 'KR',
    region: '대한민국 인천광역시',
    lat: 37.4563,
    lon: 126.7052,
    timezone: 'Asia/Seoul',
  },
  {
    id: 'city_03',
    name: '수원',
    englishName: 'Suwon',
    countryGroup: 'KR',
    region: '대한민국 경기도 수원시',
    lat: 37.2636,
    lon: 127.0286,
    timezone: 'Asia/Seoul',
  },
  {
    id: 'city_04',
    name: '대전',
    englishName: 'Daejeon',
    countryGroup: 'KR',
    region: '대한민국 대전광역시',
    lat: 36.3504,
    lon: 127.3845,
    timezone: 'Asia/Seoul',
  },
  {
    id: 'city_05',
    name: '대구',
    englishName: 'Daegu',
    countryGroup: 'KR',
    region: '대한민국 대구광역시',
    lat: 35.8714,
    lon: 128.6014,
    timezone: 'Asia/Seoul',
  },
  {
    id: 'city_06',
    name: '광주',
    englishName: 'Gwangju',
    countryGroup: 'KR',
    region: '대한민국 광주광역시',
    lat: 35.1595,
    lon: 126.8526,
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
  const seed = [
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
  ][i % 12]
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
export const fetchCurrentWeather = async () => {
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
      ...decodeWeather(current?.weather_code, isDay),
    }
  })
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
    updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    ...decodeWeather(current?.weather_code, isDay),
    hourly,
    daily,
  }
}
