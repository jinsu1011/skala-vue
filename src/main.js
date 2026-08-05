import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'

/*
 * 🧹 개발 모드에서 예전에 설치된 서비스 워커/캐시 청소
 *
 * 이전 설정에서는 개발 중에도 서비스 워커가 켜져 있었습니다.
 * 서비스 워커는 한 번 설치되면 브라우저에 계속 남아,
 * 코드를 고쳐도 예전에 저장해 둔 낡은 화면을 계속 보여줍니다.
 * (날씨 정보가 안 뜨거나 화면이 깨져 보이는 대표적인 원인)
 *
 * 그래서 개발 중에는 실행할 때마다 남아 있는 서비스 워커를 지웁니다.
 * 배포 빌드(production)에서는 이 코드가 아예 포함되지 않습니다.
 */
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => registration.unregister())
      if (registrations.length > 0) {
        console.info(
          '[개발] 남아 있던 서비스 워커를 정리했습니다. 새로고침하면 최신 코드가 뜹니다.',
        )
      }
    })
    .catch(() => {
      /* 서비스 워커를 못 지워도 앱 실행에는 문제가 없습니다 */
    })

  // 서비스 워커가 저장해 둔 캐시 저장소도 함께 비웁니다
  if (window.caches?.keys) {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => {})
  }
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
