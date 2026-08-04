import { fileURLToPath, URL } from 'node:url'
// vite.config.js는 브라우저가 아닌 Node 환경에서 실행되므로 process를 명시적으로 가져옵니다.
import process from 'node:process'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/skala-vue/' : '/',
  plugins: [
    vue(),
    vueDevTools(),

    /**
     * 📲 PWA (Progressive Web App) 설정
     *
     * 이 플러그인이 빌드할 때 자동으로 두 가지를 만들어 줍니다.
     * 1) manifest.webmanifest — 앱 이름/아이콘/색상을 브라우저에 알려주는 명함.
     *    이게 있어야 "홈 화면에 추가(Add to Home Screen)" 가 뜹니다.
     * 2) sw.js (서비스 워커) — 앱 파일을 브라우저에 미리 저장(캐시)해 두는 일꾼.
     *    덕분에 두 번째 방문부터 훨씬 빠르고, 오프라인에서도 화면이 뜹니다.
     */
    VitePWA({
      // 새 버전이 배포되면 사용자에게 묻지 않고 자동으로 갱신합니다.
      registerType: 'autoUpdate',

      /*
       * ⚠️ 개발 중에는 서비스 워커를 끕니다 (enabled: false)
       *
       * 서비스 워커는 파일을 브라우저에 캐시(저장)해 두는 일꾼입니다.
       * 배포된 앱에서는 속도를 높여주지만, 개발 중에는
       * 코드를 고쳐도 예전에 저장해 둔 화면이 계속 떠서
       * "왜 안 바뀌지?", "왜 정보가 안 뜨지?" 같은 혼란을 일으킵니다.
       * PWA 설치/오프라인 동작을 확인하려면 `npm run build && npm run preview`로 테스트하세요.
       */
      devOptions: { enabled: false },

      // public/ 안에 있어 빌드 결과에 그대로 복사될 정적 파일들
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],

      manifest: {
        name: 'SKALA Weather Globe — 3D 지구본 날씨',
        short_name: 'SKALA Weather',
        description: '3D 지구본으로 보는 실시간 도시 날씨 · 24시간/10일 예보',
        lang: 'ko',
        // 홈 화면에서 실행했을 때 열릴 주소
        start_url: '/',
        scope: '/',
        // standalone = 주소창 없이 진짜 앱처럼 전체 화면으로 실행
        display: 'standalone',
        orientation: 'portrait',
        // 상단 상태바 색과 스플래시 배경색 (앱의 짙은 남색 테마에 맞춤)
        theme_color: '#0f172a',
        background_color: '#020617',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            // maskable: 안드로이드가 아이콘을 원형/사각형 등으로 잘라낼 때 사용
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        // 미리 캐시할 파일 종류
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // 3D 지구본 텍스처가 4MB를 넘으므로 캐시 허용 용량을 넉넉히 잡습니다.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // SPA라서 어떤 주소로 새로고침해도 index.html을 돌려줍니다.
        navigateFallback: 'index.html',

        runtimeCaching: [
          {
            // ① 날씨 API — 항상 최신이 우선, 실패하면 캐시로 대체(오프라인 대응)
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'open-meteo-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 30 }, // 30분
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // ② 지구본 텍스처/지도 타일 — 잘 안 바뀌므로 캐시 우선(빠름)
            urlPattern: /^https:\/\/(unpkg\.com|.*\.tile\.openstreetmap\.org)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-texture-cache',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30일
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 실행 환경이 PORT를 지정하면 그 값을, 아니면 Vite 기본 포트(5173)를 씁니다.
    port: Number(process.env.PORT) || 5173,
  },

  build: {
    rolldownOptions: {
      output: {
        /*
         * 📦 번들 쪼개기 (최적화)
         *
         * 예전에는 앱 코드와 three.js/globe.gl이 2MB짜리 파일 하나로 합쳐져 있어서,
         * 코드를 한 줄만 고쳐도 사용자가 2MB를 통째로 다시 받아야 했습니다.
         * 무거운 라이브러리를 따로 떼어내면
         *   - 라이브러리 파일은 브라우저 캐시에 오래 남아 재방문이 빨라지고
         *   - 지도(leaflet)는 지구본과 분리돼 필요한 것만 받게 됩니다.
         */
        // Vite 8(rolldown)은 파일 경로(id)를 받아 청크 이름을 돌려주는 "함수" 형태를 씁니다.
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('/three/') || id.includes('/globe.gl/') || id.includes('/three-globe/')) {
            return 'vendor-three'
          }
          if (id.includes('/leaflet/')) return 'vendor-leaflet'
          if (id.includes('/@vue/') || id.includes('/vue-router/') || id.includes('/pinia/')) {
            return 'vendor-vue'
          }
        },
      },
    },
    /*
     * three.js + globe.gl 자체가 약 1.9MB라 이보다 작게 만들 수 없습니다.
     * (3D 렌더링 엔진의 고정 비용이며, 별도 청크로 분리해 캐시가 오래 유지됩니다)
     * 그래서 경고 기준을 현실적인 값으로 올려 불필요한 경고를 줄입니다.
     */
    chunkSizeWarningLimit: 2000,
  },
})
