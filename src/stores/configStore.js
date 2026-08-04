import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/*
 * ══════════════════════════════════════════════════════════════
 *  [실습 과제 p.191 / p.209] stores/configStore.js — 날씨 단위 전역 설정
 * ══════════════════════════════════════════════════════════════
 *
 *  왜 Pinia(전역 저장소)를 쓰나?
 *   - 단위 버튼은 '상단 내비게이션 바'에 있고,
 *     그 값을 써야 하는 곳은 '메인 목록'과 '상세 페이지'다.
 *   - 이 셋은 부모-자식 관계가 아니라서 props 로는 값을 전달할 방법이 없다.
 *   - Pinia 는 컴포넌트 계층과 상관없이 어디서든 꺼내 쓸 수 있는
 *     '별도의 창고'를 만들어 준다. (강의자료 179p)
 *
 *  Store 3요소 (강의자료 180p)
 *   state   = ref()      → 전역으로 공유할 원본 데이터
 *   getters = computed() → 원본을 실시간 가공한 읽기 전용 값
 *   actions = function() → state 를 바꾸는 핸들러
 */
export const useConfigStore = defineStore('config', () => {
  // ── state: 단위를 저장하는 변수 (초기값 celsius) ──
  const unit = ref('celsius')

  // ── getters: 현재 단위 상태에 맞는 기호 (℃ / ℉) ──
  const unitSymbol = computed(() => (unit.value === 'fahrenheit' ? '℉' : '℃'))

  // 화면에 "화씨(℉)" 처럼 한글로 띄울 때 쓰는 라벨
  const unitLabel = computed(() => (unit.value === 'fahrenheit' ? '화씨' : '섭씨'))

  // WeatherCard 가 inject 로 받아 쓰던 'C' / 'F' 한 글자 표기와 호환용
  const unitCode = computed(() => (unit.value === 'fahrenheit' ? 'F' : 'C'))

  // ── actions: 'celsius' 와 'fahrenheit' 를 토글(스위칭)하는 함수 ──
  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
  }

  /*
   * 섭씨 원본 숫자를 현재 단위에 맞춰 변환한다.
   * 강의자료 191p 의 displayTemp 계산식을 store 안으로 옮겨
   * 메인/상세에서 똑같은 코드를 두 번 쓰지 않도록 했다.
   *   ℉ = ℃ × 9 / 5 + 32
   */
  function convert(celsius) {
    if (celsius === null || celsius === undefined) return null
    if (unit.value === 'fahrenheit') {
      return Math.round((celsius * 9) / 5 + 32)
    }
    return Math.round(celsius) // 'celsius' 일 때는 원본 그대로 반환
  }

  return { unit, unitSymbol, unitLabel, unitCode, toggleUnit, convert }
})
