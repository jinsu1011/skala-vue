<script setup>
import { useRoute, useRouter } from 'vue-router'

/*
 * ══════════════════════════════════════════════════════════════
 *  [과제 4 - 요구사항 1] Catch-all Route 대응 화면
 * ══════════════════════════════════════════════════════════════
 *
 *  router/index.js 의 마지막에 등록된
 *    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundView }
 *  덕분에, 정의되지 않은 모든 주소가 이 컴포넌트로 흘러 들어온다.
 *
 *  이 화면이 없으면 <RouterView/> 가 텅 빈 채로 남아
 *  사용자는 '하얀 화면' 만 보게 된다. → 사이트가 고장난 것처럼 보임.
 */
const route = useRoute()
const router = useRouter()

const goHome = () => {
  // replace 사용: 히스토리에서 '없는 주소' 기록을 지워버린다.
  // push 를 쓰면 사용자가 뒤로가기를 눌렀을 때 다시 404 화면으로 돌아와 버린다.
  router.replace('/')
}
</script>

<template>
  <div class="not-found">
    <div class="emoji">🌤️ ❓</div>
    <h2>페이지를 찾을 수 없습니다.</h2>
    <p class="msg">
      요청하신 주소가 존재하지 않거나,<br />
      아직 개발되지 않았습니다.
    </p>
    <p class="path">
      입력한 경로: <code>{{ route.fullPath }}</code>
    </p>

    <button class="round-btn" type="button" @click="goHome">날씨 메인으로 이동</button>
  </div>
</template>

<style scoped>
.not-found {
  background: #f4f6f8;
  border-radius: 10px;
  padding: 60px 20px;
  text-align: center;
}
.emoji {
  font-size: 3rem;
  margin-bottom: 12px;
}
.not-found h2 {
  margin: 0 0 12px;
  font-size: 1.25rem;
  color: #333;
}
.msg {
  color: #888;
  font-size: 0.9rem;
  line-height: 1.7;
  margin: 0 0 16px;
}
.path {
  font-size: 0.8rem;
  color: #aaa;
  margin: 0 0 24px;
}
.path code {
  background: #e8eaed;
  padding: 2px 8px;
  border-radius: 3px;
  color: #666;
}
.round-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 20px;
  background: #1e88e5;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
}
.round-btn:hover {
  background: #1565c0;
}
</style>
