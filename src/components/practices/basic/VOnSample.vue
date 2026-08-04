<script setup>
import { ref } from 'vue'

const count = ref(0)

// Method Handler : 복잡한 로직은 script 구역에 함수로 빼서 연결한다
const lastMessage = ref('')
const showAlert = () => {
  lastMessage.value =
    '함수가 성공적으로 호출되었습니다! (호출 시각: ' + new Date().toLocaleTimeString() + ')'
}

// 함수에 인자를 넘기는 형태
const greet = (name) => {
  lastMessage.value = `${name}님, 안녕하세요!`
}
</script>

<template>
  <div class="practice-section">
    <h2>v-on 이벤트 핸들링 기초</h2>
    <p class="desc">
      v-on은 클릭·키입력 같은 사용자 동작을 감지해서 원하는 코드를 실행시킨다. 축약형은 @ 기호다.
      (v-on:click → @click)
    </p>

    <h3>1) Inline Handler — 태그 안에서 바로 처리</h3>
    <p class="desc">숫자 증감, 스위치 토글처럼 아주 간단한 연산일 때만 쓴다.</p>
    <p>현재 카운트: {{ count }}</p>
    <button @click="count++">1씩 증가</button>
    <button @click="count = 0">초기화</button>

    <h3>2) Method Handler — script의 함수를 호출</h3>
    <p class="desc">
      로직이 길어지면 태그 안이 지저분해지므로 script 구역에 함수로 만들어 이름만 연결한다.
    </p>
    <button @click="showAlert">함수 호출하기</button>
    <button @click="greet('홍길동')">인자 넘겨서 호출하기</button>
    <p class="result">{{ lastMessage || '(아직 호출 안 됨)' }}</p>

    <h3>[참고] 괄호를 붙이냐 안 붙이냐</h3>
    <table class="compare">
      <thead>
        <tr>
          <th>작성 방식</th>
          <th>Vue의 해석</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>@click="showAlert"</code></td>
          <td>함수의 <strong>주소(참조)</strong>를 리스너로 등록 → 클릭할 때 실행</td>
        </tr>
        <tr>
          <td><code>@click="greet('홍길동')"</code></td>
          <td>인자를 넘겨야 하므로 <strong>호출문 자체</strong>를 등록</td>
        </tr>
        <tr>
          <td><code>@click="showAlert()"</code></td>
          <td>인자가 없으면 굳이 괄호를 붙이지 않는 게 관례</td>
        </tr>
      </tbody>
    </table>
    <p class="desc">
      → <code>@click="showAlert"</code> 는 순수 JS의
      <code>button.addEventListener('click', showAlert)</code> 와 완전히 같은 동작이다.
    </p>
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
.result {
  background-color: #f7f7f7;
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: bold;
}
.compare {
  border-collapse: collapse;
  font-size: 0.9rem;
}
.compare th,
.compare td {
  border: 1px solid #ccc;
  padding: 6px 10px;
  text-align: left;
}
.compare th {
  background-color: #f0f0f0;
}
code {
  background-color: #eee;
  padding: 1px 5px;
  border-radius: 3px;
}
button {
  margin-right: 6px;
}
</style>
