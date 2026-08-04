<script setup>
/**
 * 🤖 오늘의 외출 팁 브리핑 카드
 *
 * 문장을 만드는 "두뇌"는 useWeatherBriefing 컴포저블에 있고,
 * 이 컴포넌트는 그 결과를 예쁘게 보여주는 "얼굴" 역할만 합니다.
 */
import { toRef } from 'vue'
import { useWeatherBriefing } from '@/composables/useWeatherBriefing'

const props = defineProps({
  weather: {
    type: Object,
    required: true,
  },
})

// toRef로 감싸면 props.weather가 바뀔 때 브리핑 문장도 자동으로 다시 계산됩니다.
const { headline, tips, tone } = useWeatherBriefing(toRef(props, 'weather'))
</script>

<template>
  <section class="glass-card briefing-card" :class="`tone-${tone}`">
    <div class="briefing-head">
      <span class="briefing-badge">🤖 AI 날씨 브리핑</span>
      <span class="briefing-city">{{ weather.name }}</span>
    </div>

    <!-- 한 줄 핵심 요약 -->
    <p class="briefing-headline">{{ headline }}</p>

    <!-- 상세 팁 목록 -->
    <ul class="tip-list">
      <li v-for="(tip, index) in tips" :key="index" class="tip-item">
        <span class="tip-icon">{{ tip.icon }}</span>
        <span class="tip-text">{{ tip.text }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.briefing-card {
  padding: 22px 24px;
  position: relative;
  overflow: hidden;
  border-left: 3px solid var(--tone-color, #38bdf8);
}

/* 분위기(tone)에 따라 강조 색을 바꿉니다 */
.tone-good {
  --tone-color: #4ade80;
}
.tone-watch {
  --tone-color: #facc15;
}
.tone-warn {
  --tone-color: #fb7185;
}

/* 카드 우측 상단에 은은한 색 번짐 효과 */
.briefing-card::after {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, var(--tone-color, #38bdf8) 0%, transparent 70%);
  opacity: 0.18;
  pointer-events: none;
}

.briefing-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.briefing-badge {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: #fff;
}

.briefing-city {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}

.briefing-headline {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.55;
  letter-spacing: -0.3px;
  color: #fff;
  margin-bottom: 16px;
}

.tip-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 12px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  font-size: 13.5px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.92);
}

.tip-icon {
  font-size: 15px;
  line-height: 1.4;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .briefing-card {
    padding: 18px;
  }
  .briefing-headline {
    font-size: 15px;
  }
  .tip-item {
    font-size: 13px;
  }
}
</style>
