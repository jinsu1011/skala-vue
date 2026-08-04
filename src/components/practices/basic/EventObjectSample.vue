<script setup>
import { ref } from 'vue'

const position = ref('')
const tagName = ref('')
const keyInfo = ref('')

// [패턴 1] 함수 이름만 넘기면 JS 엔진이 첫 번째 인자로 이벤트 객체를 자동 전달한다
const getOnlyEvent = (e) => {
  position.value = `좌표: X=${e.clientX}, Y=${e.clientY} / 이벤트 종류: ${e.type}`
}

// [패턴 2] 내 데이터도 넘기고 싶으면 $event를 명시적으로 적어준다
const getWithParam = (name, e) => {
  tagName.value = `대상: ${name} / 클릭된 태그: ${e.target.tagName} / 리스너가 걸린 태그: ${e.currentTarget.tagName}`
}

// 키보드 이벤트에서도 동일하게 이벤트 객체를 받는다
const getKeyInfo = (e) => {
  keyInfo.value =
    `누른 키(e.key): ${e.key} / 자판 위치(e.code): ${e.code} / ` +
    `Shift: ${e.shiftKey} / Ctrl: ${e.ctrlKey} / Alt: ${e.altKey}`
}
</script>

<template>
  <div class="practice-section">
    <h2>v-on 이벤트 객체($event) 활용</h2>
    <p class="desc">
      Event Object는 사용자가 클릭·키입력 등을 했을 때
      <strong>브라우저가 자동으로 만들어주는 객체</strong>다. "어디를 눌렀는지, 어떤 키를 눌렀는지"
      같은 상황 정보가 전부 담겨 있다.
    </p>

    <h3>1) 이벤트 객체만 받기 — @click="함수명"</h3>
    <p class="desc">함수 이름만 넘기면 첫 번째 인자로 이벤트 객체(e)가 자동으로 들어온다.</p>
    <button @click="getOnlyEvent">클릭 좌표 알아내기</button>
    <p class="result">{{ position || '(버튼을 눌러보세요)' }}</p>

    <h3>2) 내 데이터 + 이벤트 객체 같이 받기 — $event 명시</h3>
    <p class="desc">
      인자를 넘기는 순간 자동 전달이 끊기므로, Vue가 제공하는 <code>$event</code> 기호를 직접 적어야
      한다.
    </p>
    <button @click="getWithParam('회원A', $event)">회원 정보와 태그 확인</button>
    <p class="result">{{ tagName || '(버튼을 눌러보세요)' }}</p>
    <p class="desc">
      → e.target은 <strong>실제로 눌린 태그</strong>, e.currentTarget은
      <strong>리스너가 걸려 있는 태그</strong>다. 부모에 이벤트를 걸었을 때 둘이 달라진다.
    </p>

    <h3>3) 키보드 이벤트 객체</h3>
    <p class="desc">
      아래 입력창에 아무 키나 눌러보세요. Shift·Ctrl을 같이 누르면 값이 바뀌는 것도 확인됩니다.
    </p>
    <input @keyup="getKeyInfo" placeholder="여기에 키를 입력해 보세요" size="40" />
    <p class="result">{{ keyInfo || '(키를 눌러보세요)' }}</p>

    <h3>[참고] 자주 쓰는 속성</h3>
    <table class="compare">
      <thead>
        <tr>
          <th>속성</th>
          <th>의미</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>e.target</code></td>
          <td>이벤트를 발생시킨 태그 (e.target.value로 입력값을 꺼냄)</td>
        </tr>
        <tr>
          <td><code>e.type</code></td>
          <td>이벤트 종류 (click, keyup, submit …)</td>
        </tr>
        <tr>
          <td><code>e.clientX / e.clientY</code></td>
          <td>브라우저 화면 기준 마우스 좌표</td>
        </tr>
        <tr>
          <td><code>e.key</code></td>
          <td>누른 키의 문자값 (Enter, a, Escape …)</td>
        </tr>
        <tr>
          <td><code>e.shiftKey / e.ctrlKey</code></td>
          <td>Shift·Ctrl을 같이 누르고 있었는지 (true/false)</td>
        </tr>
      </tbody>
    </table>
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
  font-family: monospace;
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
</style>
