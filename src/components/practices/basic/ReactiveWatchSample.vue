<script setup>
import { reactive, ref, watch } from 'vue'

const state = reactive({
  productName: '노트북',
  price: 1000,
})

const logAutoDeep = ref('대기 중...')
const logTarget = ref('대기 중...')

// 1) 변수명 그대로 감시 (자동 deep: true 작동)
watch(state, (newVal, oldVal) => {
  logAutoDeep.value = `[자동 deep] 가격 변동! 이전가격인척하는:${oldVal.price}원 ➡️ 현재가격:${newVal.price}원`
})

// 2) 화살표 함수로 특정 속성만 감시 (이전 값 추적 가능!)
watch(
  () => state.price,
  (newPrice, oldPrice) => {
    logTarget.value = `[타겟 조준] 가격이 진짜 올랐음! 옛날값:${oldPrice}원 ➡️ 바뀐값:${newPrice}원`
  },
)
</script>

<template>
  <div class="practice-section">
    <h2>reactive() 데이터 watch 감시 규칙</h2>
    <h3>🛒 상품 정보 관리 (reactive)</h3>
    <p>상품명: {{ state.productName }} / 가격: {{ state.price }}원</p>
    <button type="button" @click="state.price += 500">가격 500원 인상</button>

    <div
      class="monitor auto"
      style="margin-top: 12px; padding: 10px; background-color: #ffebee; border-radius: 6px"
    >
      <p>🔍 1) state 변수 통째로 감시 (deep 자동화)</p>
      <p>{{ logAutoDeep }}</p>
      <small style="color: gray">※ 주의: 이전 값과 현재 값이 똑같이 찍힌다.</small>
    </div>

    <div
      class="monitor target"
      style="margin-top: 8px; padding: 10px; background-color: #e8f5e9; border-radius: 6px"
    >
      <p>🎯 2) () => state.price 콕 집어 감시 (과거 추적)</p>
      <p>{{ logTarget }}</p>
      <small style="color: #2e7d32">※ 성공: 과거의 원본 가격이 칼같이 보존된다.</small>
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
