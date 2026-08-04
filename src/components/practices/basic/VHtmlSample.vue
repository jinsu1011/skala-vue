<script setup>
import { ref } from 'vue'

// 1) v-html : 문자열을 실제 HTML Element로 해석해서 주입 (innerHTML과 동일)
const rawHtmlData =
  '이 글자는 <span style="color: red; font-weight: bold;">빨간색 굵은 글자</span>이다.'

// 2) v-html XSS : 사용자 입력을 그대로 v-html에 꽂으면 공격 코드가 실행된다
const inputValue = ref('')
const message = ref('')
function showMessage() {
  message.value = inputValue.value
}

// 공격 코드 샘플 (실습용) - 존재하지 않는 이미지 주소로 onerror를 강제 발동시킨다
// 강의자료 원본은 onerror="window.location.href='https://google.com'" 으로 페이지를 통째로 납치한다.
// 여기서는 실습 화면이 날아가지 않도록, 코드가 "실행됐다"는 사실만 증명하는 방식으로 바꿨다.
const xssPayload =
  `<img src="x" onerror="document.getElementById('xss-proof').textContent=` +
  `'⚠️ 공격 코드가 실행되었습니다! 여기서 쿠키/세션 토큰을 훔쳐갈 수 있다.'">`

function fillXssSample() {
  inputValue.value = xssPayload
}

// 3) v-text : 변수 값을 텍스트로 채워 넣음 (innerText와 동일, {{ }}와 결과 같음)
const content = '안녕하세요! <strong> Skala-Vue </strong> 강의입니다.'
</script>

<template>
  <div class="practice-section">
    <h2>v-html / v-html XSS / v-text 디렉티브 학습</h2>

    <h3>1) v-html — 문자열을 HTML로 해석</h3>
    <p>일반 보간법 &#123;&#123; &#125;&#125; 사용 결과:</p>
    <p class="result">{{ rawHtmlData }}</p>
    <p>v-html 디렉티브 사용 결과:</p>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <p class="result" v-html="rawHtmlData"></p>

    <h3>2) v-html XSS 위협 — v-html이 위험한 이유</h3>
    <p class="desc">
      아래 입력창에 HTML을 적고 확인을 누르면 v-html이 그대로 해석한다.<br />
      해커가 게시판 댓글에 스크립트를 심어두면, 그 글을 읽는 사람의 브라우저에서 코드가 강제로
      실행된다.
    </p>
    <input v-model="inputValue" placeholder="내용을 입력하세요" size="50" />
    <button @click="showMessage">확인</button>
    <button @click="fillXssSample">공격 코드 샘플 넣기</button>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="result" v-html="message"></div>
    <p id="xss-proof" class="proof"></p>
    <p class="desc">
      → 대응: 사용자가 입력한 값은 v-html에 절대 넣지 않고 &#123;&#123; &#125;&#125; 로 출력한다.
      보간법은 HTML을 해석하지 않고 글자 그대로 보여주므로 안전하다.
    </p>
    <p class="result">{{ message }}</p>

    <h3>3) v-text — 값을 텍스트로 채워 넣기</h3>
    <p>일반 보간법 결과:</p>
    <p class="result">출력: {{ content }}</p>
    <p>v-text 디렉티브 결과 (보간법과 동일):</p>
    <p class="result" v-text="'출력: ' + content"></p>
    <p>v-html 결과 비교 (태그가 해석됨):</p>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <p class="result" v-html="content"></p>
    <p class="desc">
      → v-text는 &#123;&#123; &#125;&#125; 와 결과가 같으므로, 실무에서는 보간법을 쓴다.
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
.result {
  background-color: #f7f7f7;
  padding: 6px 10px;
  border-radius: 4px;
}
.desc {
  color: #666;
  font-size: 0.9rem;
}
.proof {
  color: #d32f2f;
  font-weight: bold;
}
button {
  margin-left: 6px;
}
</style>
