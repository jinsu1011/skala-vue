<script setup>
import { ref } from 'vue'

const result1 = ref('')
const result2 = ref('')
const result3 = ref('')

const runTask1 = () => {
  const members = ['김수원', '이서울', '박부산', '최대전']
  const rawData = { id: 101, grade: 'VIP', details: { score: 95 } }

  const memberContainsPark = members.includes('박부산')
  const {
    grade,
    details: { score },
  } = rawData
  result1.value = `부산 포함 여부: ${memberContainsPark} / 등급: ${grade} / 점수: ${score}점`
}

const runTask2 = () => {
  const currentCart = ['Apple', 'Banana']
  const newProduct = { name: 'Orange', stock: 0, preview: null }

  const updatedCart = [...currentCart, newProduct.name]
  const imgStatus = newProduct.preview?.url ?? '이미지 준비중'
  const finalStock = newProduct.stock ?? 10

  result2.value = `카트: ${updatedCart} / 이미지: ${imgStatus} / 수량: ${finalStock}개`
}

const fetchUserId = () => new Promise((res) => setTimeout(() => res({ uid: 777 }), 400))
const fetchUserProfile = (uid) =>
  new Promise((res) => setTimeout(() => res({ uid, nick: 'Graves' }), 400))

const runTask3 = async () => {
  result3.value = '데이터 동기화 중...'
  try {
    const { uid } = await fetchUserId()
    const { nick } = await fetchUserProfile(uid)
    result3.value = `동기화 성공: ${nick}님 환영합니다.`
  } catch {
    result3.value = '통신 실패'
  }
}
</script>

<template>
  <div class="quiz-container">
    <h2>Modern JavaScript (ES6+) 실무 검증 과제집</h2>

    <div class="card">
      <h3>과제 1. 데이터 추출 및 포맷팅</h3>
      <button @click="runTask1">과제 1 가동</button>
      <div class="console">결과창 1: {{ result1 }}</div>
    </div>

    <div class="card">
      <h3>과제 2. 불변성 복사 및 데이터 방어</h3>
      <button @click="runTask2">과제 2 가동</button>
      <div class="console">결과창 2: {{ result2 }}</div>
    </div>

    <div class="card">
      <h3>과제 3. 비동기 연쇄 파이프라인 (Async/Await)</h3>
      <button @click="runTask3">과제 3 가동</button>
      <div class="console">결과창 3: {{ result3 }}</div>
    </div>
  </div>
</template>

<style scoped>
.quiz-container {
  max-width: 600px;
  margin: 24px 0;
}
.quiz-container h2 {
  font-size: 1.1rem;
  margin-bottom: 16px;
}
.card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}
.card h3 {
  font-size: 0.95rem;
  margin: 0 0 10px;
}
.card button {
  background: #343a40;
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}
.card button:hover {
  background: #495057;
}
.console {
  margin-top: 10px;
  background: #e9ecef;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  word-break: break-all;
}
</style>
