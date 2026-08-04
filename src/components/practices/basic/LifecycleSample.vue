<script setup>
import { onMounted, onUnmounted, onUpdated, ref } from 'vue'

const count = ref(0)
let timerId = null

console.log('1. [setup] 컴포넌트가 메모리에 생성되었습니다. (DOM 접근 불가능)')

onMounted(() => {
  console.log('2. [onMounted] 화면에 완벽히 부착되었습니다! (API 호출/DOM 조작 적기)')
  timerId = setInterval(() => {
    count.value++
  }, 3000)
})

onUpdated(() => {
  console.log(
    `3. [onUpdated] 데이터가 변경되어 화면을 새로 그렸습니다. (현재 count: ${count.value})`,
  )
})

onUnmounted(() => {
  clearInterval(timerId)
  console.log('4. [onUnmounted] 컴포넌트가 소멸했습니다. 타이머 청소 완료!')
})
</script>

<template>
  <div class="practice-section">
    <h2>⏰ Component Lifecycle Hook</h2>
    <div style="padding: 12px; background: #e0f7fa; border-radius: 6px">
      <p>실시간 타이머 카운트: {{ count }}</p>
      <button type="button" @click="count++">수동으로 숫자 올리기</button>
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
