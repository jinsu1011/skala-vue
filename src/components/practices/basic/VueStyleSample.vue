<script setup>
// 자바스크립트 방은 깨끗하게 비워둡니다.
</script>

<template>
  <div class="practice-section">
    <h2>Scoped 스타일 및 외부 CSS 활용</h2>

    <h3>1) scoped — 이 컴포넌트 안에서만 적용</h3>
    <p class="title">이 글자는 이 컴포넌트 내부에서만 빨간색이 됩니다.</p>
    <p class="desc">
      다른 컴포넌트에도 class="title"인 태그가 있어도 <strong>전혀 영향을 받지 않는다.</strong>
      Vue가 빌드할 때 각 태그에 고유 표식(data-v-xxxx)을 붙여 격리하기 때문이다.
    </p>

    <h3>2) 외부 CSS 가져오기 (@import)</h3>
    <button class="btn-external">외부 CSS에서 불러온 버튼 스타일</button>
    <p class="desc">
      이 버튼의 디자인은 이 파일이 아니라
      <code>src/assets/challenge.css</code> 에 정의돼 있다. 여러 컴포넌트가 공통으로 쓸 디자인은
      이렇게 따로 빼둔다.
    </p>

    <h3>[정리] 스타일 적용 3가지 방법</h3>
    <table class="compare">
      <thead>
        <tr>
          <th>방법</th>
          <th>적용 범위</th>
          <th>쓰는 곳</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>&lt;style scoped&gt;</code></td>
          <td>이 컴포넌트만</td>
          <td>대부분의 경우 (기본값처럼 씀)</td>
        </tr>
        <tr>
          <td><code>&lt;style&gt;</code> (scoped 없음)</td>
          <td>프로젝트 전체</td>
          <td>전역 스타일 — 남용하면 다른 화면이 깨진다</td>
        </tr>
        <tr>
          <td><code>main.js</code>에 등록</td>
          <td>프로젝트 전체</td>
          <td>초기화 CSS, 폰트 등 공통 기반</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* 내 방 전용 타이틀 디자인 */
.title {
  color: #ff7675;
  font-weight: bold;
  font-size: 18px;
}
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

<style>
/* 외부 스타일 파일(버튼 디자인 뭉치)을 이 방 안으로 가져옵니다 */
@import '@/assets/challenge.css';
</style>
