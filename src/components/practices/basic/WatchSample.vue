<script setup>
import { ref, watch } from 'vue'

const currentCity = ref('서울')
const logMessage = ref('아직 감시 시스템이 작동하지 않았습니다.')

watch(currentCity, (newValue, oldValue) => {
  logMessage.value = `🔍 감시자 발동! [${oldValue}]에서 [${newValue}]로 변경됨.`
  console.log(`📡 [서버 요청 완료] 기상청 서버에서 ${newValue}의 날씨 API를 다시 조회합니다...`)
})
</script>

<template>
  <div class="practice-section">
    <h2>감시자 watch()의 원리와 실무 활용</h2>
    <h3>🏙️ 지역 선택 제어판</h3>
    <p>현재 선택된 도시: {{ currentCity }}</p>
    <button type="button" @click="currentCity = '서울'">서울 선택</button>&nbsp;
    <button type="button" @click="currentCity = '수원'">수원 선택</button>&nbsp;
    <button type="button" @click="currentCity = '부산'">부산 선택</button>

    <div
      class="monitor"
      style="margin-top: 12px; padding: 12px; background-color: #e3f2fd; border-radius: 6px"
    >
      <h3>🔍 파수꾼(watch) 모니터링 시스템</h3>
      <p>{{ logMessage }}</p>
      <small style="color: gray">(버튼을 누른 후 브라우저 콘솔창 F12를 확인해 보세요)</small>
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
