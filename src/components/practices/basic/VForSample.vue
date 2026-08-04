<script setup>
import { ref } from 'vue'

// 1) 배열
const fruits = ref(['사과', '바나나', '딸기'])

// 2) 객체
const user = ref({
  name: '홍길동',
  age: 25,
  role: '개발자',
})

// 3) 배열 안의 객체 (실무에서 가장 많이 쓰는 형태 - API 응답 모양)
const items = ref([
  { id: 'prod_101', name: '아이폰' },
  { id: 'prod_102', name: '갤럭시' },
])

// 목록에 추가/삭제 해보며 반응성 확인
const newFruit = ref('')
function addFruit() {
  if (newFruit.value.trim() === '') return
  fruits.value.push(newFruit.value)
  newFruit.value = ''
}
function removeFruit(index) {
  fruits.value.splice(index, 1)
}
</script>

<template>
  <div class="practice-section">
    <h2>v-for 디렉티브 학습</h2>
    <p class="desc">
      v-for를 쓸 때는 Vue가 각 항목을 구별할 수 있도록 <strong>반드시 :key에 고유값</strong>을
      바인딩해야 한다. 안 그러면 에러 또는 성능 저하가 발생한다.
    </p>

    <h3>1) 배열 렌더링</h3>
    <ul>
      <li v-for="(fruit, index) in fruits" :key="index">
        {{ index + 1 }}번 과일: {{ fruit }}
        <button class="mini" @click="removeFruit(index)">삭제</button>
      </li>
    </ul>
    <input v-model="newFruit" placeholder="과일 이름" @keyup.enter="addFruit" />
    <button @click="addFruit">추가</button>
    <p class="desc">→ 추가/삭제하면 화면이 즉시 따라 바뀐다. 배열도 ref로 감싸면 반응형이다.</p>

    <h3>2) 객체 렌더링</h3>
    <p class="desc">객체는 (value, key, index) 순서로 꺼낸다. 배열과 순서가 다르니 주의.</p>
    <ul>
      <li v-for="(value, key, index) in user" :key="key">[{{ index }}] {{ key }} : {{ value }}</li>
    </ul>

    <h3>3) 배열 내 객체 렌더링</h3>
    <p class="desc">
      각 항목이 고유 id를 가지므로 :key에 index 대신 item.id를 쓴다. 이게 가장 좋은 방식이다.
    </p>
    <ul>
      <li v-for="(item, index) in items" :key="item.id">[{{ index }}] {{ item.name }}</li>
    </ul>

    <h3>4) v-for + v-bind 조합 (실무 패턴)</h3>
    <p class="desc">목록을 반복하면서 각 항목마다 다른 스타일을 입히는 형태.</p>
    <ul class="card-list">
      <li v-for="item in items" :key="item.id" :class="['card', item.id]">
        {{ item.name }} <small>({{ item.id }})</small>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.practice-section {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}
.desc {
  color: #666;
  font-size: 0.9rem;
}
.mini {
  font-size: 0.75rem;
  margin-left: 8px;
}
.card-list {
  list-style: none;
  padding: 0;
}
.card {
  display: inline-block;
  padding: 10px 16px;
  margin-right: 8px;
  border-radius: 6px;
  color: white;
}
.prod_101 {
  background-color: #34495e;
}
.prod_102 {
  background-color: #2980b9;
}
</style>
