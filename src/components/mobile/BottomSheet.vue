<script setup>
/**
 * 📱 Bottom Sheet — 모바일에서 위로 끌어올리는 상세 패널
 *
 * ▶ 동작 원리 (3단계)
 * 1) 손가락을 손잡이(handle)에 대면(pointerdown) 시작 위치를 기억합니다.
 * 2) 손가락을 움직이면(pointermove) "처음 위치와의 차이(dy)"만큼
 *    시트를 transform: translateY 로 실시간으로 밀어 올리거나 내립니다.
 *    이때는 CSS transition을 꺼야 손가락에 착 붙는 느낌이 납니다.
 * 3) 손을 떼면(pointerup) 가장 가까운 정착 지점(snap point)으로
 *    transition을 켠 채 부드럽게 이동시킵니다.
 *
 * ▶ 왜 pointer 이벤트인가요?
 * touch(모바일)와 mouse(데스크톱)를 하나의 코드로 처리할 수 있고,
 * setPointerCapture로 손가락이 시트 밖으로 나가도 드래그가 끊기지 않습니다.
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

/*
 * 시트가 지구본을 완전히 덮었는지 부모에게 알려 줍니다.
 * 부모(GlobeWeatherView)는 이 신호로 가려진 지구본의 렌더링을 멈춰
 * 배터리와 성능을 아낍니다.
 */
const emit = defineEmits(['cover-change'])

// 3단계 정착 지점: 살짝 보임 / 절반 / 전체
const SNAP = { peek: 'peek', half: 'half', full: 'full' }

// 손잡이 영역만 보이도록 남겨둘 높이(px)
const PEEK_VISIBLE = 132
// 이 속도(px/ms)보다 빠르게 튕기면 거리와 상관없이 그 방향으로 넘깁니다.
const FLICK_VELOCITY = 0.5

const snapState = ref(SNAP.peek) // 현재 정착 단계
const dragOffset = ref(0) // 드래그 중 추가로 밀린 거리(px)
const isDragging = ref(false)
const sheetHeight = ref(0) // 시트 전체 높이(px)
const isMobile = ref(false)

let dragStartY = 0
let dragStartTime = 0
let mediaQuery = null

/** 화면 폭을 감시해 모바일 여부를 판단합니다 (768px 이하) */
const syncViewport = () => {
  isMobile.value = mediaQuery ? mediaQuery.matches : false
  // 시트 높이는 화면 높이의 92%
  sheetHeight.value = Math.round(window.innerHeight * 0.92)
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)')
  syncViewport()
  mediaQuery.addEventListener('change', syncViewport)
  window.addEventListener('resize', syncViewport)
})

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', syncViewport)
  window.removeEventListener('resize', syncViewport)
})

/**
 * 각 정착 단계가 "얼마나 아래로 내려가 있는지"(px)
 * 0 이면 완전히 올라온 상태, 값이 클수록 화면 밖으로 내려간 상태입니다.
 */
const snapOffsets = computed(() => ({
  [SNAP.full]: 0,
  [SNAP.half]: Math.round(sheetHeight.value * 0.45),
  [SNAP.peek]: Math.max(0, sheetHeight.value - PEEK_VISIBLE),
}))

/** 현재 실제로 적용할 translateY 값 */
const currentOffset = computed(() => {
  const base = snapOffsets.value[snapState.value] ?? 0
  if (!isDragging.value) return base

  // 드래그 중에는 기본 위치 + 손가락이 움직인 거리
  const raw = base + dragOffset.value
  // 위(0)와 아래(peek) 한계를 넘지 않도록 가둡니다.
  return Math.min(snapOffsets.value[SNAP.peek], Math.max(0, raw))
})

const sheetStyle = computed(() => ({
  height: `${sheetHeight.value}px`,
  transform: `translateY(${currentOffset.value}px)`,
  // 드래그 중에는 transition을 꺼야 손가락을 그대로 따라옵니다.
  transition: isDragging.value ? 'none' : 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
}))

// ---------- 드래그 핸들러 ----------

const onPointerDown = (event) => {
  if (!isMobile.value) return
  isDragging.value = true
  dragOffset.value = 0
  dragStartY = event.clientY
  dragStartTime = Date.now()

  // 손가락이 시트 밖으로 나가도 이 요소가 계속 이벤트를 받도록 고정합니다.
  // 브라우저에 따라 유효하지 않은 pointerId면 예외를 던지는데,
  // 그때 드래그가 통째로 멈춰버리지 않도록 감싸 둡니다.
  try {
    event.currentTarget.setPointerCapture?.(event.pointerId)
  } catch {
    // 캡처에 실패해도 드래그 자체는 계속 동작합니다.
  }
}

const onPointerMove = (event) => {
  if (!isDragging.value) return
  dragOffset.value = event.clientY - dragStartY
}

const onPointerUp = (event) => {
  if (!isDragging.value) return

  const distance = dragOffset.value
  const elapsed = Math.max(1, Date.now() - dragStartTime)
  const velocity = distance / elapsed // px/ms (양수 = 아래로)

  isDragging.value = false
  try {
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  } catch {
    // 이미 해제되었거나 캡처가 없던 경우 — 무시해도 안전합니다.
  }

  const order = [SNAP.full, SNAP.half, SNAP.peek] // 위 → 아래 순서
  const currentIndex = order.indexOf(snapState.value)

  // ① 빠르게 튕긴 경우: 한 단계만 이동
  if (Math.abs(velocity) > FLICK_VELOCITY) {
    const nextIndex = velocity > 0 ? currentIndex + 1 : currentIndex - 1
    snapState.value = order[Math.min(order.length - 1, Math.max(0, nextIndex))]
    dragOffset.value = 0
    return
  }

  // ② 천천히 끈 경우: 손을 뗀 위치에서 가장 가까운 단계로 붙입니다.
  const finalOffset = (snapOffsets.value[snapState.value] ?? 0) + distance
  let nearest = SNAP.peek
  let nearestGap = Infinity
  for (const key of order) {
    const gap = Math.abs(snapOffsets.value[key] - finalOffset)
    if (gap < nearestGap) {
      nearestGap = gap
      nearest = key
    }
  }

  snapState.value = nearest
  dragOffset.value = 0
}

/** 손잡이를 탭하면 열림/닫힘을 간단히 전환 (접근성 대안 조작) */
const toggleSheet = () => {
  snapState.value = snapState.value === SNAP.peek ? SNAP.full : SNAP.peek
}

/*
 * 부모(GlobeWeatherView)가 도시를 선택했을 때 시트를 직접 열 수 있도록
 * 조작 함수를 밖으로 공개합니다.
 * defineExpose로 내보내면 부모에서 `ref.value.open()` 처럼 호출할 수 있습니다.
 */
const open = () => {
  snapState.value = SNAP.full
}

const close = () => {
  snapState.value = SNAP.peek
}

/*
 * 시트가 '전체(full)'로 열려 있고 모바일일 때만 지구본이 완전히 가려집니다.
 * 그 순간 부모에게 알려 지구본 렌더링을 멈추게 합니다.
 */
watch([snapState, isMobile], ([state, mobile]) => {
  emit('cover-change', mobile && state === SNAP.full)
})

onUnmounted(() => {
  // 시트가 사라지면 가려진 상태도 해제해야 지구본이 다시 그려집니다
  emit('cover-change', false)
})

defineExpose({ open, close, isMobile })
</script>

<template>
  <!-- 📱 모바일: 드래그 가능한 Bottom Sheet -->
  <div v-if="isMobile" class="sheet-root">
    <!-- 시트가 열려 있을 때 뒤 배경을 어둡게 (탭하면 닫힘) -->
    <div
      v-if="snapState !== SNAP.peek"
      class="sheet-backdrop"
      @click="snapState = SNAP.peek"
    ></div>

    <section class="bottom-sheet" :class="`state-${snapState}`" :style="sheetStyle">
      <!-- 드래그 손잡이 영역 -->
      <header
        class="sheet-handle-area"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="sheet-grabber"></div>
        <!-- 접혀 있을 때 보이는 요약 줄 -->
        <div class="sheet-peek">
          <slot name="peek"></slot>
          <button class="sheet-toggle-btn" @click="toggleSheet">
            {{ snapState === SNAP.peek ? '▲ 자세히' : '▼ 접기' }}
          </button>
        </div>
      </header>

      <!-- 실제 내용 (전체로 열렸을 때만 세로 스크롤 허용) -->
      <div class="sheet-body" :class="{ scrollable: snapState === SNAP.full }">
        <slot></slot>
      </div>
    </section>
  </div>

  <!-- 🖥️ 데스크톱: 시트 없이 내용만 그대로 렌더링 -->
  <div v-else class="sheet-passthrough">
    <slot></slot>
  </div>
</template>

<style scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  /*
   * ⚡ backdrop-filter 를 뺐습니다.
   * 이 요소 위에 이미 흐림 처리된 시트가 화면을 거의 다 덮는데,
   * 화면 전체 흐림을 두 겹으로 겹치면 브라우저가 매 프레임마다
   * 뒤 배경을 다시 캡처해 두 번 흐리게 만들어야 해서 매우 느려집니다.
   * 어둡게 덮는 것만으로도 시각 효과는 충분합니다.
   */
  background: rgba(2, 6, 23, 0.62);
  z-index: 900;
  animation: backdropIn 0.3s ease;
}

@keyframes backdropIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.bottom-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 950;
  display: flex;
  flex-direction: column;
  /* 배경을 좀 더 불투명하게 만들고 흐림 반경을 줄여 흐림 계산량을 낮췄습니다 */
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px) saturate(140%);
  border-top: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -14px 40px rgba(0, 0, 0, 0.5);
  will-change: transform;
}

.sheet-handle-area {
  flex-shrink: 0;
  padding: 10px 18px 12px;
  cursor: grab;
  /* 세로 드래그를 브라우저 기본 스크롤에 뺏기지 않도록 합니다 (필수!) */
  touch-action: none;
  user-select: none;
}

.sheet-handle-area:active {
  cursor: grabbing;
}

.sheet-grabber {
  width: 42px;
  height: 5px;
  margin: 0 auto 10px;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 3px;
}

.sheet-peek {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sheet-toggle-btn {
  flex-shrink: 0;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.sheet-body {
  flex: 1;
  min-height: 0;
  padding: 4px 14px 28px;
  overflow: hidden;
}

.sheet-body.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
