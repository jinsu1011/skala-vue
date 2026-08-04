<script setup>
import { ref } from 'vue'

// 1) 조건부 온/오프 스위치
const isLogged = ref(false)
// 2) 다중 조건 분기용 점수
const score = ref(85)
// 3) v-show 토글용
const isVisible = ref(true)
</script>

<template>
  <div class="practice-section">
    <h2>v-if / v-else-if / v-else / v-show 디렉티브 학습</h2>

    <h3>1) 기본 로그인 상태 스위치 (v-if / v-else)</h3>
    <p v-if="isLogged">환영합니다! 회원 전용 화면입니다.</p>
    <p v-else>로그인이 필요합니다. 먼저 로그인해 주세요.</p>
    <button @click="isLogged = !isLogged">
      {{ isLogged ? '로그아웃 하기' : '로그인 하기' }}
    </button>

    <h3>2) 성적별 학점 등급 판정 (다중 조건문)</h3>
    <label>현재 점수 입력: </label>
    <input type="number" v-model="score" min="0" max="100" step="5" />
    <div v-if="score >= 90" style="color: green; font-weight: bold">
      합격 등급: A 학점 (훌륭합니다!)
    </div>
    <div v-else-if="score >= 80" style="color: blue">합격 등급: B 학점 (양호합니다.)</div>
    <div v-else-if="score >= 70" style="color: orange">합격 등급: C 학점 (조금 더 분발하세요.)</div>
    <div v-else style="color: red; font-weight: bold">합격 등급: F 학점 (재시험 대상입니다.)</div>

    <h3>3) v-show — 숨기기만 함</h3>
    <button @click="isVisible = !isVisible">화면 토글하기</button>
    <div v-show="isVisible" class="box">
      <p>v-show 상자</p>
      <p>조건이 false가 되면 CSS display: none이 붙습니다.</p>
    </div>

    <h3>[비교] v-if vs v-show</h3>
    <p class="desc">
      아래 두 상자를 끄고 <strong>개발자도구(F12) → Elements</strong> 에서 확인해 보면 차이가
      보인다.
    </p>
    <button @click="isVisible = !isVisible">두 상자 동시에 끄고 켜기</button>
    <div v-if="isVisible" class="box compare-if"><p>v-if 상자 — 꺼지면 태그가 아예 사라짐</p></div>
    <div v-show="isVisible" class="box compare-show">
      <p>v-show 상자 — 꺼져도 태그는 남고 display:none만 붙음</p>
    </div>
    <table class="compare">
      <thead>
        <tr>
          <th>비교</th>
          <th>v-if (조건부 렌더링)</th>
          <th>v-show (조건부 가시성)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>방식</td>
          <td>DOM을 부수고 새로 만듦</td>
          <td>CSS display 속성만 조작</td>
        </tr>
        <tr>
          <td>초기 비용</td>
          <td>낮음 (false면 아예 안 그림)</td>
          <td>높음 (일단 다 그려 놓음)</td>
        </tr>
        <tr>
          <td>토글 비용</td>
          <td>높음</td>
          <td>낮음</td>
        </tr>
        <tr>
          <td>v-else 조합</td>
          <td>가능</td>
          <td>불가능</td>
        </tr>
        <tr>
          <td>언제 쓰나</td>
          <td>전환이 드묾 (로그인 후 화면)</td>
          <td>전환이 잦음 (모달, 탭, 아코디언)</td>
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
.box {
  padding: 10px;
  margin-top: 5px;
  color: white;
  border-radius: 5px;
  background-color: #3498db;
}
.compare-if {
  background-color: #e67e22;
}
.compare-show {
  background-color: #16a085;
}
.compare {
  border-collapse: collapse;
  margin-top: 10px;
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
</style>
