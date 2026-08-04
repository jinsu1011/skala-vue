<script setup>
import { ref } from 'vue'

// v-pre / v-cloak 용
const message = ref('안녕하세요!')

// v-once 용
const count = ref(1)

// v-memo 용
const name = ref('홍길동')
const age = ref(20)
</script>

<template>
  <div class="practice-section">
    <h2>v-pre / v-cloak / v-once / v-memo 디렉티브 학습</h2>
    <p class="desc">
      이 4개는 강의자료에도 "자주 사용되지 않음"으로 분류돼 있다. 뭔지만 알고 넘어가면 되는 것들.
    </p>

    <h3>1) v-pre — Vue 문법을 해석하지 말고 글자 그대로 출력</h3>
    <p>일반 출력: {{ message }}</p>
    <p v-pre>v-pre 출력: {{ message }}</p>
    <p class="desc">
      → 위는 값으로 바뀌고, 아래는 중괄호까지 그대로 보인다. 문법 설명용 문서에서 쓴다.
    </p>

    <h3>2) v-cloak — 로딩 중 깨진 화면 노출 방지</h3>
    <div v-cloak class="box">
      <p>{{ message }}</p>
    </div>
    <p class="desc">
      Vue가 로딩되기 전 아주 짧은 순간 &#123;&#123; message &#125;&#125; 같은 해석 안 된 문자열이
      노출될 수 있다. v-cloak을 붙이고 CSS에 [v-cloak] &#123; display: none &#125; 을 함께 선언해야
      작동한다. (Vite 개발환경에서는 워낙 빨라 체감되지 않는다)
    </p>

    <h3>3) v-once — 최초 한 번만 그리고 이후 고정</h3>
    <p>일반 변수 (실시간): {{ count }}</p>
    <p v-once>v-once 변수 (최초 고정): {{ count }}</p>
    <button @click="count++">숫자 증가 버튼</button>
    <p class="desc">
      → 버튼을 눌러도 v-once 쪽은 1에서 안 움직인다. 약관 내용처럼 절대 안 바뀔 데이터에 붙이면
      Vue가 감시를 안 해서 메모리가 절약된다.
    </p>

    <h3>4) v-memo — 지정한 값이 바뀔 때만 다시 그리기</h3>
    <div v-memo="[name]" class="memo-box">
      <p>v-memo 적용 영역 (기준: name)</p>
      <p>이름: {{ name }}</p>
      <p>나이: {{ age }} (name이 바뀌어야 이 값도 갱신됨)</p>
    </div>
    <button @click="name = name === '홍길동' ? '이순신' : '홍길동'">1. 이름 변경</button>
    <button @click="age++">2. 나이 한 살 추가 (age++)</button>
    <p class="desc">
      → 2번만 계속 누르면 나이가 안 바뀐다. 1번을 누르는 순간 그동안 쌓인 나이가 한꺼번에 반영된다.
      (SampleOne의 일반 변수와 똑같은 현상)
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
/* 필수: Vue가 로딩되기 전까지 해당 구역을 물리적으로 숨기는 CSS 규칙 */
[v-cloak] {
  display: none !important;
}
.box {
  padding: 10px;
  background-color: #3498db;
  color: white;
  border-radius: 5px;
}
.memo-box {
  padding: 20px;
  border: 1px solid #42b883;
  margin-bottom: 10px;
}
button {
  margin-right: 6px;
}
</style>
