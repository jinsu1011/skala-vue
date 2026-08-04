<script setup>
import { ref } from 'vue'

const lazyText = ref('')
const eagerText = ref('') // .lazy 비교용
const age = ref('')
const userEmail = ref('')
const price = ref('')
</script>

<template>
  <div class="practice-section">
    <h2>v-model 수식어 (Modifiers) 활용</h2>
    <p class="desc">
      수식어는 입력 데이터를 다듬어주는 편의 기능이다. 원래 함수 안에서 직접 처리해야 할 일을 단어
      하나로 끝낸다.
    </p>

    <h3>1) .lazy — 실시간이 아니라 확정된 시점에 반영</h3>
    <p class="desc">
      기본은 타이핑할 때마다(@input) 반영되는데, .lazy를 붙이면
      <strong>Enter를 치거나 입력창 바깥을 클릭할 때(@change)</strong> 반영된다. 검색 API를 매
      글자마다 호출하는 낭비를 막는다.
    </p>
    <input
      type="text"
      v-model.lazy="lazyText"
      placeholder="입력 후 Enter 또는 외부 클릭"
      size="30"
    />
    <p>
      확정된 값(.lazy): <strong>{{ lazyText }}</strong>
    </p>
    <input type="text" v-model="eagerText" placeholder="비교용: 수식어 없는 입력창" size="30" />
    <p>
      실시간 값(기본): <strong>{{ eagerText }}</strong>
    </p>

    <h3>2) .number — Number 타입으로 자동 변환</h3>
    <p class="desc">
      입력창의 값은 무조건 문자열로 들어온다. 그래서 20을 입력하면 숫자 20이 아니라 글자 "20"이다.
      .number를 붙이면 진짜 숫자로 바꿔준다.
    </p>
    <input type="text" v-model.number="age" placeholder="나이를 입력하세요" size="30" />
    <p>
      입력된 값: <strong>{{ age }}</strong>
    </p>
    <p>
      데이터 타입: <strong class="type">{{ typeof age }}</strong>
    </p>
    <p class="desc">
      → 타입이 string이면 <code>20 + 1</code> 이 <code>"201"</code> 이 되는 사고가 난다. 그래서 숫자
      입력에는 .number가 사실상 필수다.
    </p>

    <h3>3) .trim — 앞뒤 공백 자동 제거</h3>
    <p class="desc">
      아이디·이메일 입력 시 실수로 들어간 공백 때문에 로그인이 안 되는 일을 막는다.
    </p>
    <input
      type="text"
      v-model.trim="userEmail"
      placeholder="앞뒤 공백을 포함해 입력해 보세요"
      size="30"
    />
    <p>
      공백 제거된 값: <strong>"{{ userEmail }}"</strong>
    </p>
    <p>
      문자열 길이: <strong>{{ userEmail.length }}</strong>
    </p>

    <h3>4) Chaining — 수식어 이어 붙이기 (.trim.number)</h3>
    <p class="desc">수식어는 필요한 만큼 연달아 붙일 수 있다.</p>
    <input
      type="text"
      v-model.trim.number="price"
      placeholder="공백과 숫자를 섞어 입력해 보세요"
      size="30"
    />
    <p>
      처리된 값: <strong>"{{ price }}"</strong>
    </p>
    <p>
      데이터 타입: <strong class="type">{{ typeof price }}</strong>
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
.type {
  color: #c7254e;
  font-family: monospace;
}
code {
  background-color: #eee;
  padding: 1px 5px;
  border-radius: 3px;
}
</style>
