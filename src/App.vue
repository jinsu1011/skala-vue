<script setup>
/*
 * ══════════════════════════════════════════════════════════════
 *  [과제 4 - 요구사항 2] App.vue
 *   - Navigation Bar 추가 (RouterLink)
 *   - 메인 콘텐츠 영역 배치 (RouterView)
 * ══════════════════════════════════════════════════════════════
 *
 *  App.vue 는 '건물의 뼈대' 역할만 한다.
 *  상단 바는 항상 그 자리에 남고, <RouterView/> 안쪽만 주소에 따라 갈아끼워진다.
 *  → 이것이 SPA(Single Page Application) 의 핵심 동작이다.
 */
import { computed, watch, onUnmounted } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

/*
 * 🌍 지구본 화면은 "전체 화면(full-bleed)" 으로 보여야 한다.
 *
 * main.css 의 #app 은 모바일 앱 느낌을 내려고 max-width: 720px 로 좁혀져 있고,
 * 위 헤더/아래 푸터도 항상 붙는다. 카드형 실습 화면에는 알맞지만
 * 100vh 를 꽉 채우는 3D 지구본 화면에서는 좌우에 흰 여백이 생겨 화면이 잘린다.
 *
 * 그래서 지구본 라우트일 때만 body 에 class 를 붙여
 * #app 의 폭 제한과 여백을 풀고, 앱 헤더/푸터를 숨긴다.
 * (다른 실습 화면들은 기존 레이아웃을 그대로 유지한다)
 */
const route = useRoute()

const GLOBE_ROUTES = ['GlobeHome', 'CityWeather']
const isGlobeView = computed(() => GLOBE_ROUTES.includes(route.name))

watch(
  isGlobeView,
  (active) => {
    document.body.classList.toggle('globe-fullscreen', active)
  },
  { immediate: true },
)

// 앱이 사라질 때 body 에 남긴 class 를 정리한다 (뒷정리 습관)
onUnmounted(() => {
  document.body.classList.remove('globe-fullscreen')
})
</script>

<template>
  <div class="app-shell">
    <!-- 상단 바: 스크롤해도 따라오도록 sticky (네이버 모바일 헤더 방식) -->
    <!-- 지구본 화면에서는 자체 TopBar가 있으므로 이 헤더를 숨긴다 -->
    <header v-if="!isGlobeView" class="app-header">
      <div class="brand">
        <span class="brand-mark">⛅️</span>
        <span class="brand-name">SKALA 날씨</span>
      </div>

      <!--
        <a href="/about"> 를 쓰면 안 되는 이유:
        <a> 태그는 브라우저를 강제로 새로고침시켜 메모리에 들고 있던
        모든 반응형 데이터(ref, computed)를 초기화해 버린다. (강의자료 163p)
        <RouterLink> 는 그 새로고침을 가로채고 주소만 안전하게 바꾼다.
      -->
      <nav class="app-nav">
        <RouterLink to="/">날씨</RouterLink>
        <RouterLink to="/about">소개</RouterLink>
        <RouterLink to="/practices">실습</RouterLink>
      </nav>
    </header>

    <!--
      현재 URL(route.path)에 매칭된 컴포넌트가 '이 자리에' 렌더링된다.
      /            → WeatherHomeView
      /about       → WeatherAboutView
      /weather/xx  → WeatherDetailView
      그 외 아무거나 → NotFoundView (Catch-all)
    -->
    <main class="app-main">
      <RouterView />
    </main>

    <footer v-if="!isGlobeView" class="app-footer">
      SKALA Full-Stack · Vue 3 + Vue Router 실습 (과제 4)
    </footer>
  </div>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid #e6eaef;
  box-shadow: 0 2px 10px rgba(20, 50, 90, 0.06);
  backdrop-filter: blur(12px);
}
.brand {
  display: flex;
  align-items: center;
  gap: 6px;
}
.brand-mark {
  font-size: 1.15rem;
}
.brand-name {
  font-weight: 800;
  font-size: 0.95rem;
  color: #1f2937;
  letter-spacing: -0.3px;
}

.app-nav {
  display: flex;
  gap: 2px;
  background: #f1f4f8;
  border-radius: 999px;
  padding: 3px;
}
.app-nav a {
  padding: 5px 15px;
  border-radius: 999px;
  font-size: 0.84rem;
  color: #71797f;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}
.app-nav a:hover {
  color: #1f2937;
}

/*
  router-link-exact-active: 현재 보고 있는 페이지의 링크에 Vue Router 가
  자동으로 붙여주는 class. 우리가 직접 "지금 어느 메뉴지?" 를 계산할 필요가 없다.
*/
.app-nav a.router-link-exact-active {
  background: #fff;
  color: #1e88e5;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(20, 50, 90, 0.12);
}

.app-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 0.72rem;
  color: #aab3bd;
}
</style>
