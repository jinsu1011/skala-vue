<script setup>
import { computed, ref, watch, watchEffect } from 'vue'

const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원', temp: 24, status: '비' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름' },
])

const filteredWeatherList = computed(() => {
  if (!searchQuery.value.trim()) return weatherList.value
  return weatherList.value.filter((item) => item.name.includes(searchQuery.value.trim()))
})

watch(selectedCityInfo, (newVal) => {
  console.log(`👁️ [watch 감지] 상태 바 문구가 업데이트되었습니다 -> "${newVal}"`)
})

watchEffect(() => {
  console.log(
    `🤖 [watchEffect 자동 호출] 현재 검색어 '${searchQuery.value}'에 매칭되는 API 데이터를 필터링합니다.`,
  )
})

const selectCity = (city) => {
  selectedCityInfo.value = `${city.name}이(가) 선택되었습니다.`
}

const showDetail = (city, e) => {
  e.stopPropagation()
  alert(`${city.name}의 현재 날씨는 [${city.status}] 상태입니다.`)
}
</script>

<template>
  <div class="practice-section">
    <h2>☁️ 과제 2: 날씨 (컴포지션)</h2>

    <div class="card-box" style="border: 1px solid #eee; padding: 12px; margin-bottom: 12px">
      <h3>🔍 도시 검색</h3>
      <input v-model="searchQuery" placeholder="검색할 도시 이름 입력" />
      <p style="font-size: 0.85rem; color: #666">검색 중인 도시: {{ searchQuery }}</p>
    </div>

    <div class="card-box" style="border: 1px solid #eee; padding: 12px">
      <h3>🏙️ 지역별 날씨 현황</h3>

      <div v-if="filteredWeatherList.length > 0">
        <div
          v-for="city in filteredWeatherList"
          :key="city.id"
          style="
            border: 1px solid #ccc;
            padding: 10px;
            margin-bottom: 8px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
          @click="selectCity(city)"
        >
          <div>
            <strong>{{ city.name }} ({{ city.status }})</strong><br />
            <span>현재 기온: {{ city.temp }}°C</span><br />
            <span
              style="font-size: 0.8rem; padding: 2px 6px; border-radius: 4px; color: white"
              :style="{ backgroundColor: city.temp >= 25 ? '#ff5722' : '#2196f3' }"
            >
              {{ city.temp >= 25 ? '🔥 더움 (25도 이상)' : '❄️ 선선함 (25도 미만)' }}
            </span>
          </div>
          <button type="button" @click="(e) => showDetail(city, e)">상세보기</button>
        </div>
      </div>
      <div v-else style="color: #888; padding: 12px 0">검색 결과가 일치하는 도시가 없습니다.</div>

      <div
        class="status-bar"
        style="
          margin-top: 12px;
          padding: 10px;
          background: #e8f5e9;
          color: #2e7d32;
          border-radius: 6px;
          text-align: center;
        "
      >
        {{ selectedCityInfo }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.practice-section {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}
button {
  margin-right: 6px;
}
</style>
