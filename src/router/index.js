import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    // ── 🪐 태양계 3D 메인 (새 진입점) ──
    {
      path: '/',
      name: 'SolarSystem',
      component: () => import('@/views/SolarSystemView.vue'),
    },

    // ── 🌍 지구: 기존 날씨 지구본 (100% 그대로 보존) ──
    {
      path: '/earth',
      name: 'GlobeHome',
      component: () => import('@/views/GlobeWeatherView.vue'),
    },
    {
      path: '/earth/city/:cityId',
      name: 'CityWeather',
      component: () => import('@/views/GlobeWeatherView.vue'),
    },

    // ── 🪐 개별 행성 3D 탐색 ──
    {
      path: '/planet/:planetId',
      name: 'PlanetDetail',
      component: () => import('@/views/PlanetDetailView.vue'),
    },

    // ── 기존 라우트 (변경 없음) ──
    {
      path: '/classic',
      name: 'WeatherClassic',
      component: () => import('@/views/WeatherHomeView.vue'),
    },
    {
      path: '/weather/:cityId',
      name: 'WeatherDetail',
      component: () => import('@/views/WeatherDetailView.vue'),
    },
    {
      path: '/about',
      name: 'WeatherAbout',
      component: () => import('@/views/WeatherAboutView.vue'),
    },
    {
      path: '/practices',
      name: 'Practices',
      component: () => import('@/views/PracticeAllView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],

  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
