import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      name: 'GlobeHome',
      component: () => import('@/views/GlobeWeatherView.vue'),
    },
    {
      path: '/city/:cityId',
      name: 'CityWeather',
      component: () => import('@/views/GlobeWeatherView.vue'),
    },
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
