<script setup>
/**
 * 📲 "홈 화면에 추가" 설치 버튼
 *
 * ▶ 원리
 * 크롬/엣지는 PWA 설치 조건(manifest + 서비스 워커 + HTTPS)을 만족하면
 * `beforeinstallprompt` 라는 이벤트를 브라우저가 먼저 던져 줍니다.
 * 이 이벤트를 붙잡아(preventDefault) 보관해 두었다가,
 * 사용자가 우리 버튼을 눌렀을 때 prompt()를 호출해 설치창을 띄웁니다.
 *
 * ※ iOS 사파리는 이 이벤트를 지원하지 않습니다.
 *    그래서 iOS에서는 "공유 → 홈 화면에 추가" 안내 문구를 대신 보여줍니다.
 */
import { ref, onMounted, onUnmounted } from 'vue'

const deferredPrompt = ref(null) // 보관해 둔 설치 이벤트
const showIosGuide = ref(false)
const installed = ref(false)

// 이벤트 핸들러를 변수에 담아두어야 나중에 정확히 제거할 수 있습니다.
const onBeforeInstall = (e) => {
  e.preventDefault() // 브라우저 기본 설치 배너를 막고
  deferredPrompt.value = e // 우리가 원하는 시점에 띄우기 위해 보관
}

const onInstalled = () => {
  installed.value = true
  deferredPrompt.value = null
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onBeforeInstall)
  window.addEventListener('appinstalled', onInstalled)

  // 이미 홈 화면 앱으로 실행 중이면 버튼을 숨깁니다.
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  if (isStandalone) installed.value = true
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  window.removeEventListener('appinstalled', onInstalled)
})

const handleInstall = async () => {
  if (!deferredPrompt.value) {
    // 안드로이드/크롬이 아닌 환경(주로 iOS) → 수동 안내
    showIosGuide.value = !showIosGuide.value
    return
  }

  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') installed.value = true
  // 설치 이벤트는 한 번만 쓸 수 있으므로 사용 후 비웁니다.
  deferredPrompt.value = null
}
</script>

<template>
  <div v-if="!installed" class="install-wrap">
    <button class="install-btn" title="이 앱을 홈 화면에 추가" @click="handleInstall">
      <span class="install-icon">📲</span>
      <span class="install-text">앱 설치</span>
    </button>

    <!-- iOS 사파리용 수동 설치 안내 -->
    <div v-if="showIosGuide" class="ios-guide">
      <p>
        <strong>홈 화면에 추가하기</strong><br />
        하단 공유 버튼 <span class="ios-share">⬆️</span> 을 누른 뒤<br />
        <strong>‘홈 화면에 추가’</strong>를 선택하세요.
      </p>
      <button class="guide-close" @click="showIosGuide = false">닫기</button>
    </div>
  </div>
</template>

<style scoped>
.install-wrap {
  position: relative;
}

.install-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(56, 189, 248, 0.18);
  border: 1px solid rgba(56, 189, 248, 0.45);
  border-radius: 20px;
  color: #e0f2fe;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.install-btn:hover {
  background: rgba(56, 189, 248, 0.32);
  border-color: #38bdf8;
}

.ios-guide {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 230px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  color: #e2e8f0;
  font-size: 12.5px;
  line-height: 1.6;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.5);
  z-index: 1200;
}

.ios-share {
  color: #38bdf8;
}

.guide-close {
  margin-top: 10px;
  width: 100%;
  padding: 6px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .install-text {
    display: none;
  }
  .install-btn {
    padding: 8px 10px;
  }
}
</style>
