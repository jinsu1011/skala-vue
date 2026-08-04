<script setup>
/**
 * 🪐 SolarSystemView — 3D 태양계 메인 뷰
 *
 * 행성을 클릭하면:
 *   - 지구 → 기존 날씨 지구본으로 이동 (/earth)
 *   - 다른 행성 → 이 화면에서 정보 패널을 바로 띄움 (표면온도, 지름, 질량 등)
 */
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useSolarSystem } from '@/composables/useSolarSystem'

const router = useRouter()
const containerRef = ref(null)
const showLabels = ref(true)

const { initSolarSystem, labelCoords, hoveredPlanet, selectedPlanet } = useSolarSystem()

// 지구 클릭 시 기존 날씨 지구본으로 이동
const handleEarthClick = () => {
  router.push({ name: 'GlobeHome' })
}

// 정보 패널 닫기
const closeInfoPanel = () => {
  selectedPlanet.value = null
}

// 지름 비교 (지구 대비 몇 배)
const diameterRatio = (diameterStr) => {
  const km = parseFloat(diameterStr.replace(/,/g, ''))
  const earthKm = 12742
  if (isNaN(km)) return '-'
  const ratio = km / earthKm
  if (ratio > 100) return `지구의 약 ${Math.round(ratio)}배`
  if (ratio >= 1) return `지구의 약 ${ratio.toFixed(1)}배`
  return `지구의 약 ${ratio.toFixed(2)}배`
}

onMounted(async () => {
  await nextTick()
  initSolarSystem(containerRef.value, handleEarthClick)
})
</script>

<template>
  <div class="solar-system-view">
    <!-- Three.js Canvas -->
    <div ref="containerRef" class="solar-canvas"></div>

    <!-- 상단 헤더 -->
    <header class="solar-topbar">
      <div class="solar-brand">
        <span class="brand-icon">🪐</span>
        <div>
          <h1 class="brand-title">SKALA Solar System</h1>
          <p class="brand-sub">행성을 클릭하여 탐색 · 🌍 지구 클릭 → 실시간 날씨</p>
        </div>
      </div>

      <div class="solar-controls">
        <button
          class="label-toggle"
          :class="{ active: showLabels }"
          @click="showLabels = !showLabels"
        >
          🌡️ {{ showLabels ? '라벨 숨기기' : '온도 라벨' }}
        </button>
        <RouterLink to="/earth" class="nav-link">🌍 지구 날씨</RouterLink>
        <RouterLink to="/practices" class="nav-link">📚 실습</RouterLink>
      </div>
    </header>

    <!-- 3D 공간 투영 라벨 -->
    <div v-if="showLabels" class="label-overlay">
      <div
        v-for="label in labelCoords"
        :key="label.id"
        class="planet-label"
        :class="{
          hovered: hoveredPlanet === label.id,
          earth: label.id === 'earth',
          selected: selectedPlanet && selectedPlanet.id === label.id,
        }"
        :style="{
          left: `${label.x}px`,
          top: `${label.y}px`,
          opacity: label.visible ? 1 : 0,
          borderColor: label.color,
        }"
      >
        <span class="label-name">{{ label.name }}</span>
        <span class="label-temp" :style="{ color: label.color }">{{ label.temp }}</span>
        <span v-if="label.id === 'earth'" class="label-hint">클릭 → 날씨</span>
      </div>
    </div>

    <!-- 행성 정보 패널 (클릭 시 표시) -->
    <Transition name="info-slide">
      <aside v-if="selectedPlanet" class="planet-info-panel">
        <div class="info-header">
          <div class="info-title-row">
            <span class="info-icon">{{ selectedPlanet.icon }}</span>
            <div>
              <h2 class="info-name">{{ selectedPlanet.name }} ({{ selectedPlanet.nameEn }})</h2>
              <span class="info-badge">{{ selectedPlanet.category }}</span>
            </div>
          </div>
          <button class="info-close" @click="closeInfoPanel">✕</button>
        </div>

        <!-- 핵심 온도 -->
        <div class="temp-card" :style="{ borderColor: selectedPlanet.colorHex }">
          <span class="tc-label">🌡️ 표면 온도</span>
          <span class="tc-value" :style="{ color: selectedPlanet.colorHex }">{{ selectedPlanet.surfaceTemp }}</span>
        </div>

        <!-- 설명 -->
        <p class="info-desc">{{ selectedPlanet.description }}</p>

        <!-- 정보 타일 -->
        <div class="info-tiles">
          <div class="tile">
            <span class="tile-icon">📏</span>
            <div class="tile-body">
              <span class="tile-label">지름</span>
              <span class="tile-val">{{ selectedPlanet.diameterKm }}</span>
              <span class="tile-sub">{{ diameterRatio(selectedPlanet.diameterKm) }}</span>
            </div>
          </div>
          <div class="tile">
            <span class="tile-icon">⚖️</span>
            <div class="tile-body">
              <span class="tile-label">질량</span>
              <span class="tile-val">{{ selectedPlanet.mass }}</span>
            </div>
          </div>
          <div class="tile">
            <span class="tile-icon">🔄</span>
            <div class="tile-body">
              <span class="tile-label">공전 주기</span>
              <span class="tile-val">{{ selectedPlanet.orbitalPeriod }}</span>
            </div>
          </div>
          <div class="tile">
            <span class="tile-icon">🌀</span>
            <div class="tile-body">
              <span class="tile-label">자전 주기</span>
              <span class="tile-val">{{ selectedPlanet.rotationPeriod }}</span>
            </div>
          </div>
          <div class="tile">
            <span class="tile-icon">🏋️</span>
            <div class="tile-body">
              <span class="tile-label">표면 중력</span>
              <span class="tile-val">{{ selectedPlanet.gravity }}</span>
            </div>
          </div>
          <div class="tile">
            <span class="tile-icon">💨</span>
            <div class="tile-body">
              <span class="tile-label">대기 구성</span>
              <span class="tile-val">{{ selectedPlanet.atmosphere }}</span>
            </div>
          </div>
        </div>

        <!-- 재미있는 사실 -->
        <div class="fun-fact">
          <span class="fact-title">💡 알고 계셨나요?</span>
          <p>{{ selectedPlanet.funFact }}</p>
        </div>
      </aside>
    </Transition>

    <!-- 하단 힌트 -->
    <div class="bottom-hint">
      🖱️ 드래그: 회전 · 스크롤: 줌 · 클릭: 행성 정보
    </div>
  </div>
</template>

<style scoped>
.solar-system-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #020617;
}

.solar-canvas {
  width: 100%;
  height: 100%;
}

/* ── 상단 헤더 ── */
.solar-topbar {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  color: #fff;
  z-index: 100;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
}

.solar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon { font-size: 28px; }

.brand-title {
  font-size: 18px;
  font-weight: 800;
  background: linear-gradient(135deg, #fde047, #f97316, #ef4444);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 2px;
}

.solar-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-toggle {
  padding: 7px 14px;
  background: rgba(250, 204, 21, 0.15);
  border: 1px solid rgba(250, 204, 21, 0.4);
  border-radius: 14px;
  color: #fde047;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.label-toggle:hover, .label-toggle.active {
  background: rgba(250, 204, 21, 0.3);
}

.nav-link {
  padding: 7px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.18);
}

/* ── 라벨 오버레이 ── */
.label-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 50;
}

.planet-label {
  position: absolute;
  transform: translate(-50%, -100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 4px 10px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  border: 1.5px solid;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  transition: all 0.15s ease;
  white-space: nowrap;
}

.planet-label.hovered {
  transform: translate(-50%, -100%) scale(1.15);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
}

.planet-label.selected {
  transform: translate(-50%, -100%) scale(1.2);
  background: rgba(250, 204, 21, 0.15);
}

.planet-label.earth { border-color: #3b82f6 !important; background: rgba(29, 78, 216, 0.3); }

.label-name { font-size: 11px; font-weight: 700; color: #e2e8f0; }
.label-temp { font-size: 11px; font-weight: 800; letter-spacing: -0.3px; }
.label-hint { font-size: 9px; color: #93c5fd; margin-top: 1px; }

/* ── 행성 정보 패널 ── */
.planet-info-panel {
  position: absolute;
  top: 80px;
  right: 16px;
  width: 340px;
  max-height: calc(100vh - 130px);
  overflow-y: auto;
  padding: 20px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 22px;
  color: #fff;
  z-index: 200;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.info-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-icon { font-size: 32px; }

.info-name {
  font-size: 18px;
  font-weight: 800;
  color: #f8fafc;
}

.info-badge {
  display: inline-block;
  margin-top: 2px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.65);
}

.info-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  width: 32px; height: 32px;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.info-close:hover { background: rgba(255, 255, 255, 0.25); }

.temp-card {
  text-align: center;
  padding: 16px;
  border: 2px solid;
  border-radius: 18px;
  background: rgba(0, 0, 0, 0.3);
  margin-bottom: 14px;
}

.tc-label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.tc-value {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.5px;
}

.info-desc {
  font-size: 13px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 16px;
}

.info-tiles {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.tile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
}

.tile-icon { font-size: 18px; }
.tile-body { display: flex; flex-direction: column; }
.tile-label { font-size: 11px; color: rgba(255, 255, 255, 0.5); }
.tile-val { font-size: 13px; font-weight: 700; color: #f1f5f9; }
.tile-sub { font-size: 11px; color: #fde047; font-weight: 600; margin-top: 1px; }

.fun-fact {
  padding: 14px;
  background: rgba(250, 204, 21, 0.08);
  border: 1px solid rgba(250, 204, 21, 0.2);
  border-radius: 14px;
}

.fact-title {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #fde047;
  margin-bottom: 6px;
}

.fun-fact p {
  font-size: 12px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
}

/* ── 하단 힌트 ── */
.bottom-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 20px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  z-index: 100;
}

/* ── 패널 트랜지션 ── */
.info-slide-enter-active, .info-slide-leave-active {
  transition: all 0.3s ease;
}

.info-slide-enter-from, .info-slide-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

@media (max-width: 768px) {
  .solar-topbar {
    flex-direction: column;
    align-items: flex-start;
  }
  .brand-sub { display: none; }
  .solar-controls { flex-wrap: wrap; }

  .planet-info-panel {
    top: auto;
    bottom: 0;
    right: 0; left: 0;
    width: 100%;
    max-height: 55vh;
    border-radius: 22px 22px 0 0;
  }
}
</style>
