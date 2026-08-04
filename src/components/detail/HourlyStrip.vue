<script setup>
import { ref } from 'vue'
import { useWeatherStore } from '@/stores/weatherStore'
import TempCurveChart from '@/components/detail/TempCurveChart.vue'

defineProps({
  hourly: {
    type: Array,
    default: () => [],
  },
  sunrise: {
    type: String,
    default: '',
  },
  sunset: {
    type: String,
    default: '',
  },
})

const weatherStore = useWeatherStore()

/**
 * 한 칸(1시간)의 가로 폭(px)
 *
 * 곡선 차트와 아래 시간 목록이 "같은 폭"을 써야 점과 시간이 정확히 겹칩니다.
 * 그래서 숫자를 한 곳에서만 정의하고 CSS와 차트에 함께 넘겨줍니다.
 */
const ITEM_WIDTH = 62

// 곡선 차트를 보이거나 숨기는 스위치 (기본은 켬)
const showCurve = ref(true)
</script>

<template>
  <div class="glass-card hourly-card">
    <div class="card-title">
      <span>⏱️ 24시간 일기예보</span>

      <!-- 📈 곡선 그래프 표시 토글 -->
      <button class="curve-toggle" :class="{ on: showCurve }" @click="showCurve = !showCurve">
        📈 기온 곡선
      </button>
    </div>

    <!--
      곡선과 시간 목록을 "하나의" 가로 스크롤 상자에 함께 넣습니다.
      따로 두면 스크롤이 어긋나므로, 같은 상자 안에서 위아래로 쌓아
      스크롤 위치가 항상 자동으로 동기화되게 만드는 것이 핵심입니다.
    -->
    <div class="hourly-scroll-area">
      <!-- ① 기온 베지에 곡선 -->
      <TempCurveChart v-if="showCurve" :hourly="hourly" :item-width="ITEM_WIDTH" />

      <!-- ② 시간별 아이콘 / 기온 / 강수확률 -->
      <div class="hourly-strip-wrapper">
        <div
          v-for="(item, index) in hourly"
          :key="index"
          class="hourly-item"
          :style="{ width: ITEM_WIDTH + 'px' }"
        >
          <span class="hourly-time">{{ item.label }}</span>
          <span class="hourly-icon">{{ item.icon }}</span>
          <span class="hourly-temp">{{ weatherStore.convertTemp(item.temp) }}°</span>

          <!-- 강수확률 & 강수량 막대 -->
          <div v-if="item.pop > 0" class="pop-badge">
            <span class="pop-text">{{ item.pop }}%</span>
            <div class="pop-bar-bg">
              <div class="pop-bar-fill" :style="{ height: Math.min(100, item.pop) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hourly-card {
  padding: 18px 20px;
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.curve-toggle {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.curve-toggle:hover {
  color: #fff;
}

.curve-toggle.on {
  background: rgba(56, 189, 248, 0.22);
  border-color: #38bdf8;
  color: #fff;
}

/* 곡선 + 시간 목록을 함께 감싸는 단 하나의 가로 스크롤 상자 */
.hourly-scroll-area {
  overflow-x: auto;
  padding-bottom: 10px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.hourly-strip-wrapper {
  display: flex;
  /* 칸 너비를 정확히 맞춰야 하므로 gap 대신 각 칸의 고정 width를 사용합니다 */
  gap: 0;
  width: max-content;
}

.hourly-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.hourly-time {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
}

.hourly-icon {
  font-size: 22px;
}

.hourly-temp {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.pop-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  margin-top: 4px;
}

.pop-text {
  font-size: 10px;
  font-weight: 700;
  color: #38bdf8;
}

.pop-bar-bg {
  width: 4px;
  height: 24px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.pop-bar-fill {
  width: 100%;
  background: #38bdf8;
  border-radius: 2px;
}
</style>
