<script setup>
/*
 * ══════════════════════════════════════════════════════════════
 *  [Code Challenge p.190 / p.208] Store (counter.js) 사용하기
 * ══════════════════════════════════════════════════════════════
 *  Pinia 3단계
 *   Step 1. Pinia 등록  (src/main.js 의 app.use(createPinia()))
 *   Step 2. Store 생성  (src/stores/counter.js)
 *   Step 3. Store 사용  ← 지금 이 파일
 */

// 1. 정의한 카운터 스토어 플러그인 import
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

// 2. 인스턴스 가동 (전역 저장소 포인터 확보)
const counterStore = useCounterStore()

/*
 * 3. state / getters / actions 사용
 *
 *  ⚠️ 자주 하는 실수 (강의자료 184p)
 *     const { count } = counterStore  ← 이렇게 하면 Proxy 연결이 끊겨 화면이 안 바뀐다.
 *     데이터(state/getters)는 storeToRefs 로 감싸야 반응형이 보존되고,
 *     함수(actions)는 그냥 구조분해해도 괜찮다.
 */
const { count, doubleCount } = storeToRefs(counterStore)
const { increment } = counterStore
</script>

<template>
  <div class="practice-section">
    <h2>🍍 Counter Store 활용 실습</h2>

    <p>
      원본 카운트 데이터(state):
      <strong>{{ counterStore.count }}</strong>
    </p>
    <p>
      2배 연산 데이터(getters):
      <span>{{ counterStore.doubleCount }}</span>
    </p>

    <button type="button" @click="counterStore.increment">숫자 1 증가 (actions)</button>

    <div class="hint">
      <p class="hint-title">✅ storeToRefs 로 꺼내 쓴 값 (위 버튼과 똑같이 움직인다)</p>
      <p>count: {{ count }} / doubleCount: {{ doubleCount }}</p>
      <button type="button" class="ghost" @click="increment">구조분해한 action 으로 증가</button>
    </div>

    <p class="devtools">
      💡 Vue Devtools → 🍍(Pinia) 탭을 열면 store 이름 <code>counter</code> 아래 state·getters 가
      실시간으로 보인다. (강의자료 190p)
    </p>
  </div>
</template>

<style scoped>
.hint {
  margin-top: 14px;
  padding: 10px 12px;
  background: #f6f8fb;
  border: 1px solid #e6ebf1;
  border-radius: 8px;
  font-size: 0.85rem;
}
.hint-title {
  font-weight: 700;
  color: #15803d;
  margin: 0 0 4px;
}
.ghost {
  margin-top: 6px;
  background: #fff;
  color: #475569;
  border: 1px solid #d8dfe7;
}
.devtools {
  margin-top: 12px;
  font-size: 0.78rem;
  color: #94a3b8;
}
.devtools code {
  background: #eef2f7;
  padding: 1px 5px;
  border-radius: 3px;
}
</style>
