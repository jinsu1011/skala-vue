<script setup>
/**
 * 📈 24시간 기온 곡선 차트 (순수 SVG, 외부 차트 라이브러리 없음)
 *
 * ▶ 핵심 원리
 * 1) 시간별 기온 배열 → (x, y) 좌표 배열로 변환합니다.
 *    x는 "몇 번째 시간인지"로, y는 "기온이 최저~최고 중 어디쯤인지"로 정합니다.
 *    SVG는 y축이 아래로 갈수록 커지므로, 기온이 높을수록 y가 작아지도록 뒤집습니다.
 *
 * 2) 점들을 직선으로 이으면 각져 보입니다. 그래서 각 구간을 3차 베지에 곡선
 *    (SVG path의 C 명령)으로 잇습니다. 이때 조절점(control point)을
 *    "앞뒤 점이 만드는 기울기"로 계산하는 방식이 Catmull-Rom 스플라인이며,
 *    아이폰 날씨앱처럼 부드럽게 흐르는 곡선이 만들어집니다.
 */
import { computed } from 'vue'
import { useWeatherStore } from '@/stores/weatherStore'

const props = defineProps({
  hourly: {
    type: Array,
    default: () => [],
  },
  // 아래 24시간 목록의 칸 너비와 반드시 같아야 곡선과 시간이 정확히 겹칩니다.
  itemWidth: {
    type: Number,
    default: 62,
  },
})

const weatherStore = useWeatherStore()

// 차트 세로 크기 및 위/아래 여백 (여백이 있어야 라벨이 잘리지 않습니다)
const HEIGHT = 96
const PAD_TOP = 26
const PAD_BOTTOM = 14

const chartWidth = computed(() => Math.max(1, props.hourly.length) * props.itemWidth)

/**
 * 기온 → 화면 좌표 변환
 */
const points = computed(() => {
  const list = props.hourly
  if (list.length === 0) return []

  const temps = list.map((h) => h.temp)
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  // 하루 종일 기온이 같은 극단적 경우 0으로 나누는 것을 막습니다.
  const span = max - min || 1
  const usableHeight = HEIGHT - PAD_TOP - PAD_BOTTOM

  return list.map((h, i) => ({
    // 칸의 정중앙에 점을 찍습니다.
    x: i * props.itemWidth + props.itemWidth / 2,
    // (기온 - 최저) / 전체폭 → 0~1 비율. 1에서 빼서 위아래를 뒤집습니다.
    y: PAD_TOP + (1 - (h.temp - min) / span) * usableHeight,
    temp: h.temp,
    isMax: h.temp === max,
    isMin: h.temp === min,
    index: i,
  }))
})

/**
 * Catmull-Rom → 3차 베지에 path 문자열 생성
 */
const curvePath = computed(() => {
  const pts = points.value
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`

  let d = `M ${pts[0].x} ${pts[0].y}`

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i] // 첫 구간은 자기 자신을 이전 점으로 사용
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? pts[i + 1] // 마지막 구간도 마찬가지

    // 조절점 = 현재 점 + (다음 점 - 이전 점) / 6
    // 6으로 나누는 것은 Catmull-Rom을 베지에로 바꿀 때의 표준 계수입니다.
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }

  return d
})

/**
 * 곡선 아래를 채우는 영역 path
 * 곡선 끝에서 바닥으로 내려가 시작점까지 되돌아온 뒤 Z(닫기)를 붙이면 됩니다.
 */
const areaPath = computed(() => {
  const pts = points.value
  if (pts.length < 2) return ''
  const first = pts[0]
  const last = pts[pts.length - 1]
  return `${curvePath.value} L ${last.x} ${HEIGHT} L ${first.x} ${HEIGHT} Z`
})

// 최고/최저 기온 지점만 라벨을 붙여 화면이 지저분해지지 않게 합니다.
const labelPoints = computed(() => {
  const pts = points.value
  if (pts.length === 0) return []
  const maxPoint = pts.find((p) => p.isMax)
  const minPoint = pts.find((p) => p.isMin)
  // 최고와 최저가 같은 점이면 하나만 표시
  return [maxPoint, minPoint].filter((p, i, arr) => p && arr.indexOf(p) === i)
})
</script>

<template>
  <svg
    v-if="points.length > 0"
    class="temp-curve"
    :width="chartWidth"
    :height="HEIGHT"
    :viewBox="`0 0 ${chartWidth} ${HEIGHT}`"
    role="img"
    aria-label="24시간 기온 변화 곡선"
  >
    <defs>
      <!-- 곡선 아래 영역: 위는 진하고 아래로 갈수록 투명해지는 그라데이션 -->
      <linearGradient id="tempAreaGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.42" />
        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
      </linearGradient>
      <!-- 선 자체도 왼→오 그라데이션을 주어 생동감을 더합니다 -->
      <linearGradient id="tempLineGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#fbbf24" />
        <stop offset="50%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#a78bfa" />
      </linearGradient>
    </defs>

    <!-- ① 곡선 아래 채움 -->
    <path :d="areaPath" fill="url(#tempAreaGradient)" />

    <!-- ② 부드러운 기온 곡선 -->
    <path
      :d="curvePath"
      fill="none"
      stroke="url(#tempLineGradient)"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- ③ 각 시간의 데이터 점 -->
    <circle
      v-for="p in points"
      :key="p.index"
      :cx="p.x"
      :cy="p.y"
      :r="p.index === 0 ? 4.5 : 2.5"
      :fill="p.index === 0 ? '#fff' : 'rgba(255,255,255,0.85)'"
      :stroke="p.index === 0 ? '#38bdf8' : 'none'"
      stroke-width="2"
    />

    <!-- ④ 최고/최저 기온 라벨 -->
    <text
      v-for="p in labelPoints"
      :key="`label-${p.index}`"
      :x="p.x"
      :y="p.y - 10"
      class="peak-label"
      text-anchor="middle"
    >
      {{ weatherStore.convertTemp(p.temp) }}°
    </text>
  </svg>
</template>

<style scoped>
.temp-curve {
  display: block;
  overflow: visible;
}

.peak-label {
  fill: #fff;
  font-size: 11px;
  font-weight: 700;
  paint-order: stroke;
  stroke: rgba(15, 23, 42, 0.6);
  stroke-width: 3px;
  stroke-linejoin: round;
}
</style>
