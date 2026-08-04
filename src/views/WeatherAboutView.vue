<script setup>
import { useRouter } from 'vue-router'

/*
 * ══════════════════════════════════════════════════════════════
 *  [과제 4 - 요구사항 5] WeatherAboutView.vue
 *   - 서비스 소개 정적 페이지
 *   - 메인 대시보드로 돌아가기
 * ══════════════════════════════════════════════════════════════
 *
 *  이 파일은 router/index.js 에서 () => import(...) 로 등록되어 있다.
 *  → 사용자가 '서비스 소개' 메뉴를 누르는 순간에야 이 코드가 다운로드된다. (Lazy Loading)
 *    브라우저 개발자도구 Network 탭을 켜고 메뉴를 눌러 보면
 *    WeatherAboutView-xxxx.js 파일이 그때 새로 내려오는 것을 볼 수 있다.
 */
const router = useRouter()

const goDashboard = () => {
  router.push('/')
}
</script>

<template>
  <div class="card">
    <h3>ℹ️ 서비스 소개</h3>

    <p class="intro">
      본 앱은 <strong>Vue 3</strong> 및 <strong>Vue Router 4</strong> 기반으로 제작된 실습용 기상
      관측 대시보드 시스템입니다.
    </p>

    <ul class="feature-list">
      <li><code>components/exercise/</code> 폴더 내부의 독립 부품 컴포넌트 연동</li>
      <li>클라이언트 사이드 라우팅을 통한 새로고침 없는 화면 전환</li>
      <li>URL 쿼리 스트링 매핑을 활용한 실시간 검색 상태 동기화</li>
      <li>동적 경로 매칭(<code>/weather/:cityId</code>)을 통한 지역별 상세 페이지 제공</li>
      <li>Catch-all Route 로 잘못된 주소 접근 시 안내 화면 표시</li>
    </ul>

    <div class="tech-box">
      <h4>사용 기술</h4>
      <div class="tags">
        <span class="tag">Vue 3 Composition API</span>
        <span class="tag">Vue Router</span>
        <span class="tag">Vite</span>
        <span class="tag">Open-Meteo API</span>
      </div>
    </div>

    <button class="wide-btn" type="button" @click="goDashboard">대시보드 홈으로 이동</button>
  </div>
</template>

<style scoped>
.card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.card h3 {
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 1.1rem;
}
.intro {
  font-size: 0.92rem;
  color: #444;
  margin: 0 0 12px;
}
.feature-list {
  margin: 0 0 16px;
  padding-left: 20px;
  font-size: 0.88rem;
  color: #555;
  line-height: 2;
}
.feature-list code,
.intro code {
  background: #eef4ff;
  color: #1565c0;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.85em;
}
.tech-box {
  background: #f7f9fc;
  border: 1px solid #e8edf5;
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 16px;
}
.tech-box h4 {
  margin: 0 0 8px;
  font-size: 0.85rem;
  color: #666;
}
.tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.tag {
  font-size: 0.76rem;
  background: #fff;
  border: 1px solid #d5dee9;
  border-radius: 12px;
  padding: 3px 10px;
  color: #37474f;
}
.wide-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background: #1e88e5;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
}
.wide-btn:hover {
  background: #1565c0;
}
</style>
