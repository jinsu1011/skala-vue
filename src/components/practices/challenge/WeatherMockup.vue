<script setup>
import { ref, computed } from 'vue'

// [요구사항 1] 배열 렌더링용 날씨 데이터
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원', temp: 24, status: '비' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름' },
  { id: 'city_04', name: '강릉', temp: 21, status: '흐림' },
])

// [요구사항 3] 한글 검색어 — v-model이 아니라 :value + @input으로 처리
// v-model은 한글 조합(IME)이 끝나야 반영되므로 실시간 한글 검색에 부적합하다.
const keyword = ref('')
const onInput = (e) => {
  keyword.value = e.target.value
}

// [추가] 검색어로 목록 필터링
const filteredList = computed(() => {
  const k = keyword.value.trim()
  if (!k) return weatherList.value
  return weatherList.value.filter((city) => city.name.includes(k))
})

// [요구사항 4] 카드 클릭 → 상태바에 표기
const statusBar = ref('')
const selectCity = (cityName) => {
  statusBar.value = `${cityName}이 선택되었습니다.`
}

// [요구사항 4] 상세보기 버튼 → 버블링 없이 alert
const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}
</script>

<template>
  <div class="practice-section">
    <h2>🌤️ 과제 1: 날씨 (Mockup)</h2>

    <!-- [요구사항 3] 양방향 바인딩 및 한글 처리 -->
    <section class="card-box">
      <h3>🔍 도시 검색</h3>
      <input
        type="text"
        :value="keyword"
        @input="onInput"
        placeholder="검색할 도시 이름 입력"
        class="search-input"
      />
      <p class="sub">검색 중인 도시: {{ keyword }}</p>
    </section>

    <!-- [요구사항 1] 배열 렌더링 (v-for, :key에 id 바인딩) -->
    <section class="card-box">
      <h3>📋 지역별 날씨 현황</h3>
      <div
        v-for="city in filteredList"
        :key="city.id"
        class="weather-card"
        @click="selectCity(city.name)"
      >
        <div class="info">
          <p class="city-name">{{ city.name }} ({{ city.status }})</p>
          <p class="sub">현재 기온: {{ city.temp }}°C</p>

          <!-- [요구사항 2] 조건부 렌더링 (v-if / v-else) -->
          <span v-if="city.temp >= 25" class="badge hot">🔥 더움 (25도 이상)</span>
          <span v-else class="badge cool">❄️ 선선함 (25도 미만)</span>
        </div>

        <!-- [요구사항 4] .stop으로 버블링 차단 → 카드 선택 이벤트가 안 터짐 -->
        <button class="detail-btn" @click.stop="showDetail(city.name, city.status)">
          상세보기
        </button>
      </div>

      <p v-if="filteredList.length === 0" class="empty">검색 결과가 없습니다.</p>
    </section>

    <!-- 상태바 -->
    <p class="status-bar">{{ statusBar || '카드를 클릭하거나 검색해 보세요.' }}</p>
  </div>
</template>

<style scoped>
.practice-section {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background-color: #fafbfc;
}
.card-box {
  background-color: white;
  border: 1px solid #e3e6ea;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 12px;
}
.search-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.weather-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e3e6ea;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.weather-card:hover {
  background-color: #f2f6fa;
}
.city-name {
  font-weight: bold;
  margin: 0 0 4px;
}
.sub {
  color: #888;
  font-size: 0.85rem;
  margin: 0;
}
.badge {
  display: inline-block;
  margin-top: 6px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  color: white;
}
.badge.hot {
  background-color: #e74c3c;
}
.badge.cool {
  background-color: #3498db;
}
.detail-btn {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  white-space: nowrap;
}
.detail-btn:hover {
  background-color: #eee;
}
.status-bar {
  background-color: #eaf7ee;
  border: 1px solid #cfe9d6;
  border-radius: 6px;
  padding: 10px;
  text-align: center;
  margin: 0;
}
.empty {
  color: #999;
  text-align: center;
  padding: 10px;
}
</style>
