<script setup>
import { ref } from 'vue'

const comment = ref('') // textarea → 문자열
const isAgreed = ref(false) // 단일 체크박스 → 불리언
const favoriteFruits = ref([]) // 다중 체크박스 → 반드시 배열([])로 시작!
const gender = ref('') // radio → 문자열
const selectedCar = ref('') // select → 문자열
</script>

<template>
  <div class="practice-section">
    <h2>모든 HTML Form 요소와 v-model 매핑</h2>
    <p class="desc">
      v-model을 쓸 때는 <strong>HTML 요소의 성격에 맞게 ref 초기값 타입을 선언</strong>해야 한다. 안
      그러면 의도치 않은 버그가 난다.
    </p>

    <h3>1) Textarea (장문 텍스트) → ref('')</h3>
    <textarea v-model="comment" placeholder="의견을 남겨주세요" rows="3" cols="40"></textarea>
    <p>
      데이터 상태: <span class="state">{{ comment }}</span>
    </p>

    <h3>2) 단일 Checkbox (동의 여부) → ref(false)</h3>
    <label><input type="checkbox" v-model="isAgreed" /> 약관에 동의합니다.</label>
    <p>
      데이터 상태: <span class="state">{{ isAgreed }}</span>
    </p>

    <h3>3) 다중 Checkbox (복수 선택) → ref([]) 배열</h3>
    <label><input type="checkbox" value="사과" v-model="favoriteFruits" /> 사과</label>&nbsp;
    <label><input type="checkbox" value="바나나" v-model="favoriteFruits" /> 바나나</label>&nbsp;
    <label><input type="checkbox" value="딸기" v-model="favoriteFruits" /> 딸기</label>
    <p>
      데이터 상태 (배열): <span class="state">{{ favoriteFruits }}</span>
    </p>
    <p class="desc">
      → 같은 변수에 여러 체크박스를 물리면 Vue가 알아서 배열로 담아준다. 초기값을 ''로 쓰면 깨진다.
    </p>

    <h3>4) Radio (단일 선택) → ref('')</h3>
    <label><input type="radio" value="남성" v-model="gender" /> 남성</label>&nbsp;
    <label><input type="radio" value="여성" v-model="gender" /> 여성</label>
    <p>
      데이터 상태: <span class="state">{{ gender }}</span>
    </p>

    <h3>5) Select (드롭다운) → ref('')</h3>
    <select v-model="selectedCar">
      <option value="">-- 선택하세요 --</option>
      <option value="tesla">테슬라</option>
      <option value="hyundai">현대자동차</option>
      <option value="bmw">BMW</option>
    </select>
    <p>
      데이터 상태: <span class="state">{{ selectedCar }}</span>
    </p>
    <p class="desc">→ 화면에 보이는 글자가 아니라 option의 <strong>value</strong> 값이 담긴다.</p>

    <h3>[참고] 내부 이벤트의 차이</h3>
    <table class="compare">
      <thead>
        <tr>
          <th>요소</th>
          <th>기반 이벤트</th>
          <th>반응 시점</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>input, textarea</td>
          <td><code>@input</code></td>
          <td>타이핑할 때마다</td>
        </tr>
        <tr>
          <td>checkbox, radio, select</td>
          <td><code>@change</code></td>
          <td>값이 확정되는 시점</td>
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
.state {
  background-color: #f7f7f7;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
  color: #c7254e;
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
