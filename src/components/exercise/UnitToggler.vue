<script setup>
/*
 * ══════════════════════════════════════════════════════════════
 *  [실습 과제 p.191 / p.209 - 요구사항 1,2] UnitToggler.vue
 *   - 대시보드 상단(내비게이션 바 옆)에 배치되는 단위 설정 변경 UI
 * ══════════════════════════════════════════════════════════════
 *
 *  이 컴포넌트에는 props 도 emits 도 없다.
 *  부모에게 값을 받지도, 올려보내지도 않고
 *  전역 창고(Pinia)에 직접 손을 넣어 읽고 바꾸기 때문이다.
 */
import { useConfigStore } from '@/stores/configStore'

// 인스턴스 가동 = 전역 저장소로 가는 '포인터' 확보
const configStore = useConfigStore()

/*
 * ⚠️ 여기서 const { unit } = configStore 처럼 구조분해하면 안 된다. (강의자료 184p)
 *    Proxy 연결이 끊겨 버튼을 눌러도 화면이 갱신되지 않는다.
 *    → configStore.unit 처럼 '점(.)' 을 붙여 통째로 쓰거나 storeToRefs 를 써야 한다.
 */
</script>

<template>
  <div class="unit-toggler">
    <span class="current">
      날씨단위: {{ configStore.unitLabel }}({{ configStore.unitSymbol }})
    </span>
    <button type="button" class="toggle-btn" @click="configStore.toggleUnit">단위변경</button>
  </div>
</template>

<style scoped>
.unit-toggler {
  display: flex;
  align-items: center;
  gap: 6px;
}
.current {
  font-size: 0.74rem;
  color: #64748b;
  white-space: nowrap;
}
.toggle-btn {
  padding: 4px 10px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
  background: #334155;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}
.toggle-btn:hover {
  background: #1e293b;
}

@media (max-width: 480px) {
  .current {
    display: none;
  }
}
</style>
