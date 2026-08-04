<script setup>
/*
 * ══════════════════════════════════════════════════════════════
 *  [Code Challenge p.203~204 / p.208] Axios Weather Example
 *   - Open Weather Map 호출 예제를 통한 기본 동작 원리 파악
 * ══════════════════════════════════════════════════════════════
 *
 *  fetch() 와 뭐가 다른가? (강의자료 201p)
 *   - fetch  : res.json() 을 한 번 더 호출해야 데이터가 나온다 / 에러도 직접 처리
 *   - axios  : 응답이 이미 JSON 객체(response.data) / 4xx·5xx 는 자동으로 catch 로 간다
 */
import { ref } from 'vue'
import axios from 'axios'

/*
 * 🔑 API 키는 소스코드에 박아두지 않는다. (강의자료 265p, 274p)
 *    프로젝트 루트에 .env.local 파일을 만들고 아래 한 줄을 적으면 여기로 주입된다.
 *      VITE_OPENWEATHER_KEY=발급받은키
 *    Vite 는 VITE_ 로 시작하는 변수만 브라우저 코드로 내보낸다.
 */
const ENV_KEY = import.meta.env.VITE_OPENWEATHER_KEY ?? ''

// .env 가 아직 없어도 실습을 할 수 있게, 화면에서 키를 직접 붙여넣는 칸도 열어둔다.
const inputKey = ref(ENV_KEY)

const weatherData = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

// 수원 좌표 (강의자료 199p 의 lat/lon 방식)
const LAT = 37.2636
const LON = 127.0286

const handleFetchWeather = async () => {
  const API_KEY = inputKey.value.trim()

  if (!API_KEY) {
    errorMessage.value = 'API 키가 없습니다. openweathermap.org 에서 발급 후 아래 칸에 넣어주세요.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  const URL = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=kr`

  try {
    // 비동기 통신: 서버에서 데이터를 다 가져올 때까지 await 로 기다린다.
    const response = await axios.get(URL)

    // fetch 와 달리 .json() 파싱 단계가 없다. response.data 가 이미 객체다.
    console.log('Axios 통신 응답 전체 객체:', response)
    console.log('백엔드가 준 핵심 날씨 데이터(JSON):', response.data)

    weatherData.value = response.data
  } catch (error) {
    // 4xx, 5xx 에러나 네트워크 오프라인 시 자동으로 reject 되어 여기로 온다.
    console.error('통신 중 에러가 발생했습니다:', error)
    errorMessage.value =
      error.response?.status === 401
        ? 'API 키가 아직 활성화되지 않았거나 잘못되었습니다. (401) — 발급 후 최대 2시간 걸립니다.'
        : `데이터를 가져오지 못했습니다: ${error.message}`
  } finally {
    // 성공하든 실패하든 무조건 실행 (로딩 스피너 종료 자리)
    isLoading.value = false
  }
}
</script>

<template>
  <div class="practice-section">
    <h2>⚡ Axios 통신 검증 (Open Weather Map)</h2>

    <button type="button" :disabled="isLoading" @click="handleFetchWeather">
      {{ isLoading ? '데이터 로딩 중...' : '실시간 날씨 데이터 당겨오기' }}
    </button>

    <div v-if="weatherData" class="result-card">
      <p>
        📍 위치: <strong>{{ weatherData.name }}</strong>
      </p>
      <p>
        🌡️ 현재 기온: <strong>{{ weatherData.main.temp }}℃</strong> (units=metric 이라 섭씨)
      </p>
      <p>
        ☁️ 날씨 상태: <strong>{{ weatherData.weather[0].description }}</strong>
      </p>
      <p>
        💧 습도: <strong>{{ weatherData.main.humidity }}%</strong>
      </p>
    </div>
    <div v-else class="empty">
      <p>아직 가져온 데이터가 없습니다. 버튼을 눌러 통신을 가동하세요.</p>
    </div>

    <p v-if="errorMessage" class="error">⚠️ {{ errorMessage }}</p>

    <!-- 🔑 키 입력칸: .env.local 에 VITE_OPENWEATHER_KEY 를 넣으면 자동으로 채워진다 -->
    <label class="key-row">
      <span>API Key</span>
      <input v-model="inputKey" type="password" placeholder="openweathermap.org 에서 발급" />
    </label>
    <p class="key-hint">
      실습용으로 잠깐 붙여넣는 칸입니다. 실제로는
      <code>.env.local</code> 에 <code>VITE_OPENWEATHER_KEY</code> 로 넣고 Git 에는 올리지 않습니다.
    </p>
  </div>
</template>

<style scoped>
.result-card {
  margin-top: 12px;
  padding: 12px 14px;
  background: #f3f8ff;
  border: 1px solid #d9e7fb;
  border-radius: 10px;
  font-size: 0.9rem;
  line-height: 1.9;
}
.result-card p {
  margin: 0;
}
.empty {
  margin-top: 12px;
  font-size: 0.85rem;
  color: #94a3b8;
}
.error {
  margin-top: 10px;
  font-size: 0.82rem;
  color: #b45309;
  background: #fef6e4;
  border-radius: 8px;
  padding: 8px 12px;
}
.key-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}
.key-row span {
  font-size: 0.78rem;
  color: #64748b;
  white-space: nowrap;
}
.key-row input {
  flex: 1;
  padding: 6px 10px;
  font-size: 0.82rem;
  border: 1px solid #dde3ea;
  border-radius: 6px;
}
.key-hint {
  margin-top: 6px;
  font-size: 0.74rem;
  color: #a3adb8;
}
.key-hint code {
  background: #eef2f7;
  padding: 1px 5px;
  border-radius: 3px;
}
</style>
