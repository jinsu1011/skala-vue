<script setup>
import { ref } from 'vue'

// 1) v-bind 기본 : HTML 속성(href, src, disabled...)에 JS 값을 연결
const dynamicUrl = 'https://www.naver.com'
const logoImgSrc = 'https://vuejs.org/images/logo.png'
const isButtonDisabled = ref(true)

// 2) Class Binding : 조건에 따라 CSS 클래스를 붙였다 뗐다
const isWarning = ref(false) // 객체 형식용 스위치
const themeClass = ref('bg-dark') // 배열 형식용 고정 클래스

// 3) Style Binding : 인라인 style을 값으로 직접 제어
const textColor = ref('purple')
const boxWidth = ref(150)
const baseBoxStyle = ref({
  backgroundColor: '#42b883',
  height: '100px',
  transition: 'all 0.3s ease',
})

// 4) Same-name Shorthand : 변수명과 속성명이 같으면 값을 생략 가능 (Vue 3.4+)
const id = 'user-profile-card'
const src = 'https://vuejs.org/images/logo.png'
</script>

<template>
  <div class="practice-section">
    <h2>v-bind 디렉티브 학습</h2>

    <h3>1) 기본 (축약형: 콜론)</h3>
    <p class="desc">
      실무에서는 v-bind를 다 쓰지 않고 콜론(:) 하나만 남기는 축약형을 100% 사용한다.
    </p>
    <p>동적 링크 연결: <a :href="dynamicUrl" target="_blank">여기를 클릭하면 네이버로 이동</a></p>
    <p>동적 이미지 연결: <img :src="logoImgSrc" alt="Vue 로고" style="width: 60px" /></p>
    <p>버튼 비활성화 제어 — 현재 상태: {{ isButtonDisabled }}</p>
    <button :disabled="isButtonDisabled">동의해야 클릭할 수 있는 버튼</button>
    <button @click="isButtonDisabled = !isButtonDisabled">위 버튼 잠금 해제/토글</button>

    <h3>2) Class Binding — 디자인 '옷'을 갈아 입힐 때 (실무 90%)</h3>
    <p class="desc">객체 형식: :class="&#123; '클래스명': 조건 &#125;" — 조건이 true일 때만 적용</p>
    <p :class="{ 'text-danger': isWarning }">현재 경고 상태: {{ isWarning }}</p>
    <button @click="isWarning = !isWarning">경고 상태 토글</button>
    <p class="desc">배열 형식: :class="[고정클래스, 조건 ? 'A' : 'B']" — 여러 클래스 조합</p>
    <div :class="[themeClass, isWarning ? 'border-red' : 'border-gray']">
      다중 클래스가 조립된 박스 구역입니다.
    </div>

    <h3>3) Style Binding — 수치·색상을 실시간 미세 조정할 때 (10%)</h3>
    <p class="desc">
      객체 형식: :style="&#123; color: 변수 &#125;" — CSS 속성명은 camelCase로 쓴다
      (background-color → backgroundColor)
    </p>
    <p :style="{ color: textColor, fontWeight: 'bold' }">이 글자의 색상은 실시간으로 바뀝니다.</p>
    <button @click="textColor = textColor === 'purple' ? 'blue' : 'purple'">글자 색상 토글</button>
    <p class="desc">배열 형식: 여러 스타일 객체를 하나로 합쳐서 주입</p>
    <label>박스 가로 크기(px): </label>
    <input type="number" v-model="boxWidth" step="50" />
    <div :style="[baseBoxStyle, { width: boxWidth + 'px' }]">
      <p style="color: white; padding: 10px; text-align: center">
        가로 크기: {{ boxWidth }}px 박스
      </p>
    </div>

    <h3>4) Same-name Shorthand (Vue 3.4+)</h3>
    <p class="desc">
      변수명과 HTML 속성명이 똑같으면 ="값" 부분을 생략할 수 있다. (:src="src" → :src)
    </p>
    <div :id>
      <img :src alt="Vue 로고" style="width: 50px" />
      <p>이 div의 id는 개발자도구에서 "{{ id }}" 로 확인된다.</p>
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
.desc {
  color: #666;
  font-size: 0.9rem;
}
.text-danger {
  color: red;
  font-weight: bold;
}
.bg-dark {
  background-color: #333;
  color: white;
  padding: 15px;
}
.border-red {
  border: 3px solid red;
}
.border-gray {
  border: 3px solid #ccc;
}
button {
  margin-right: 6px;
}
</style>
