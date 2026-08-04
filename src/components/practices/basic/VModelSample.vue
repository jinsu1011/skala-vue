<script setup>
import { ref } from 'vue'

const text1 = ref('') // v-model용 변수
const text2 = ref('') // 원리 이해용 변수
</script>

<template>
  <div class="practice-section">
    <h2>v-model 양방향 데이터 바인딩</h2>
    <p class="desc">
      양방향 바인딩이란
      <strong>입력창을 고치면 데이터가 바뀌고, 데이터가 바뀌면 입력창도 바뀌는</strong> 것이다.
      v-model 하나면 끝난다.
    </p>

    <h3>1) v-model 축약 문법 (양방향)</h3>
    <input type="text" v-model="text1" placeholder="여기에 입력하세요" size="30" />
    <p>
      입력된 값: <strong>{{ text1 }}</strong>
    </p>
    <button @click="text1 = '코드로 값 바꾸기'">데이터 쪽에서 값 바꾸기</button>
    <p class="desc">
      → 버튼을 누르면 <strong>입력창 글자도 같이 바뀐다.</strong> 이게 "양방향"의 나머지 절반이다.
    </p>

    <h3>2) v-model의 내부 작동 원리 (단방향 + 이벤트)</h3>
    <p class="desc">
      v-model은 마법이 아니라 <code>:value</code>(데이터 → 화면)와 <code>@input</code>(화면 →
      데이터)을 합쳐 놓은 것뿐이다. 아래는 그걸 직접 풀어 쓴 것으로, 위와 동작이 완전히 같다.
    </p>
    <input
      type="text"
      :value="text2"
      @input="(e) => (text2 = e.target.value)"
      placeholder="원리 파악용 입력창"
      size="30"
    />
    <p>
      입력된 값: <strong>{{ text2 }}</strong>
    </p>

    <h3>[중요] 한글 입력 시 차이가 생긴다</h3>
    <p class="desc">
      위 두 입력창에 <strong>한글</strong>을 천천히 쳐 보자. 1번(v-model)은 글자가 완성돼야 값이
      반영되고, 2번(:value + @input)은 자음·모음 조합 중에도 즉시 반영된다.
    </p>
    <p class="desc">
      한글은 여러 키를 조합해 한 글자를 만드는데(IME), v-model은 조합이 끝날 때까지 기다린다. 그래서
      <strong>실시간 한글 검색</strong>을 만들 때는 v-model 대신 :value + @input을 쓴다. (98p
      과제에서 이 방식을 요구하는 이유)
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
code {
  background-color: #eee;
  padding: 1px 5px;
  border-radius: 3px;
}
</style>
