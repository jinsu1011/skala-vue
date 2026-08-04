<script setup>
import { computed, inject, onMounted, onUnmounted, onUpdated, ref } from 'vue'

// [과제 요구사항] 부모로부터 도시 객체를 통째로 주입받는다. (Props Down)
// [추가 실습] validator 로 객체의 내부 형태까지 검증 (강의자료 143p)
const props = defineProps({
  city: {
    type: Object,
    required: true,
    validator: (value) =>
      ['id', 'name', 'temp', 'status'].every((key) => key in value) &&
      typeof value.temp === 'number',
  },
  // 현재 선택된 카드인지 (부모가 알려준다)
  selected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-card', 'click-detail'])

/* [추가 실습] Provide/Inject (강의자료 150~151p)
 * WeatherHomeView 가 provide 한 값을
 * 중간의 BaseDashboardCard 를 건너뛰고 바로 받는다. → Props Drilling 방지 */
const tempUnit = inject('tempUnit', ref('C'))

// 섭씨 → 화씨 변환은 표시용이므로 computed 로 캐싱
const toUnit = (celsius) =>
  tempUnit.value === 'F' ? Math.round(celsius * (9 / 5) + 32) : Math.round(celsius)

const displayTemp = computed(() => toUnit(props.city.temp))
const displayMax = computed(() => toUnit(props.city.tempMax ?? props.city.temp))
const displayMin = computed(() => toUnit(props.city.tempMin ?? props.city.temp))

// 더움/선선함 판정은 단위와 무관하게 항상 섭씨 25도 기준
const isHot = computed(() => props.city.temp >= 25)

/* ────── Lifecycle Hook (강의자료 133~135p) ────── */
// ⚠️ 일부러 ref 가 아니다. onUpdated 안에서 반응형 값을 바꾸면 무한 루프에 빠진다.
let renderCount = 0

onMounted(() => {
  console.log(`🟢 [onMounted] '${props.city.name}' 카드가 DOM 에 부착됨`)
})

onUpdated(() => {
  renderCount += 1
  console.log(`🔄 [onUpdated] '${props.city.name}' 카드 재렌더링 ${renderCount}회`)
})

// v-for 목록에서 필터링으로 빠지면 이 카드는 실제로 소멸한다.
onUnmounted(() => {
  console.log(`🧹 [onUnmounted] '${props.city.name}' 카드가 화면에서 제거됨`)
})
</script>

<template>
  <div
    class="weather-row"
    :class="[`grp-${city.group}`, { selected }]"
    @click="emit('select-card', city)"
  >
    <div class="icon">{{ city.icon }}</div>

    <div class="info">
      <div class="name-line">
        <strong>{{ city.name }}</strong>
        <span class="badge" :class="isHot ? 'hot' : 'cool'">
          {{ isHot ? '더움' : '선선' }}
        </span>
      </div>
      <div class="status">{{ city.status }}</div>
    </div>

    <div class="temps">
      <div class="now">{{ displayTemp }}°</div>
      <div class="range">
        <span class="max">{{ displayMax }}°</span>
        <span class="sep">/</span>
        <span class="min">{{ displayMin }}°</span>
      </div>
    </div>

    <!-- .stop = e.stopPropagation(). 없으면 카드 선택 이벤트까지 같이 터진다 -->
    <button class="detail-btn" type="button" @click.stop="emit('click-detail', city)">
      <span class="detail-label">상세</span>
      <span class="chevron">›</span>
    </button>
  </div>
</template>

<style scoped>
.weather-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  margin-bottom: 8px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #eceff3;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}
.weather-row:hover {
  transform: translateY(-1px);
  border-color: #d6e2f0;
  box-shadow: 0 4px 14px rgba(30, 70, 130, 0.08);
}
.weather-row.selected {
  border-color: #1e88e5;
  box-shadow: 0 0 0 2px rgba(30, 136, 229, 0.12);
}

/* 날씨 그룹별 컬러 인디케이터 (네이버 날씨의 좌측 색 띠) */
.weather-row::before {
  content: '';
  width: 4px;
  align-self: stretch;
  border-radius: 4px;
  background: #cbd5e1;
}
.grp-clear::before {
  background: linear-gradient(#fbbf24, #f59e0b);
}
.grp-cloud::before {
  background: linear-gradient(#94a3b8, #64748b);
}
.grp-rain::before {
  background: linear-gradient(#60a5fa, #2563eb);
}
.grp-snow::before {
  background: linear-gradient(#bae6fd, #7dd3fc);
}
.grp-storm::before {
  background: linear-gradient(#818cf8, #4f46e5);
}
.grp-fog::before {
  background: linear-gradient(#cbd5e1, #94a3b8);
}

.icon {
  font-size: 1.9rem;
  line-height: 1;
  width: 40px;
  text-align: center;
}
.info {
  flex: 1;
  min-width: 0;
}
.name-line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.name-line strong {
  font-size: 1.02rem;
  font-weight: 700;
  color: #1f2937;
}
.badge {
  font-size: 0.68rem;
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 600;
}
.badge.hot {
  color: #c2410c;
  background: #ffedd5;
}
.badge.cool {
  color: #1d4ed8;
  background: #dbeafe;
}
.status {
  font-size: 0.82rem;
  color: #8b95a1;
  margin-top: 1px;
}

.temps {
  text-align: right;
  line-height: 1.25;
}
.now {
  font-size: 1.5rem;
  font-weight: 300;
  color: #1f2937;
  letter-spacing: -0.5px;
}
.range {
  font-size: 0.76rem;
  color: #9aa4b0;
}
.range .max {
  color: #ef4444;
}
.range .min {
  color: #3b82f6;
}
.range .sep {
  margin: 0 2px;
  color: #d1d5db;
}

.detail-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px 6px 10px;
  border: 1px solid #e5e9ef;
  border-radius: 999px;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.76rem;
  cursor: pointer;
  white-space: nowrap;
}
.detail-btn:hover {
  background: #eef2f7;
  color: #1e88e5;
  border-color: #cfe0f5;
}
.chevron {
  font-size: 1.05rem;
  line-height: 1;
}

@media (max-width: 480px) {
  .detail-label {
    display: none;
  }
}
</style>
