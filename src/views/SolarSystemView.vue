<script setup>
/**
 * 🪐 SolarSystemView — 3D 태양계 메인 뷰
 *
 * 앱의 첫 화면. Three.js 로 태양 + 8대 행성이 공전하는 3D 태양계를 보여준다.
 * 행성을 클릭하면 해당 행성의 상세 탐색 뷰로 이동하고,
 * 지구를 클릭하면 기존 날씨 지구본 화면으로 이동한다.
 */
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useSolarSystem } from '@/composables/useSolarSystem'

const router = useRouter()
const containerRef = ref(null)
const showLabels = ref(true)

const { initSolarSystem, labelCoords, hoveredPlanet } = useSolarSystem()

// 행성 클릭 시 라우터 이동
const handlePlanetClick = (planetData) => {
  if (planetData.isEarth) {
    // 지구 → 기존 날씨 지구본
    router.push({ name: 'GlobeHome' })
  } else {
    // 다른 행성 → 행성 상세 뷰
    router.push({ name: 'PlanetDetail', params: { planetId: planetData.id } })
  }
}

onMounted(async () => {
  await nextTick()
  initSolarSystem(containerRef.value, handlePlanetClick)
})
</script>

<template>
  <div class="solar-system-view">
    <!-- Three.js Canvas 렌더링 영역 -->
    <div ref="containerRef" class="solar-canvas"></div>

    <!-- 상단 헤더 -->
    <header class="solar-topbar">
      <div class="solar-brand">
        <span class="brand-icon">🪐</span>
        <div>
          <h1 class="brand-title">SKALA Solar System</h1>
          <p class="brand-sub">행성을 클릭하여 탐색하세요 · 지구를 클릭하면 날씨 지구본으로 이동합니다</p>
        </div>
      </div>

      <div class="solar-controls">
        <button
          class="label-toggle"
          :class="{ active: showLabels }"
          @click="showLabels = !showLabels"
        >
          🌡️ {{ showLabels ? '라벨 숨기기' : '온도 라벨 보기' }}
        </button>

        <RouterLink to="/classic" class="nav-link">📊 클래식 뷰</RouterLink>
        <RouterLink to="/practices" class="nav-link">📚 실습 보관함</RouterLink>
      </div>
    </header>

    <!-- 3D 공간에 투영되는 행성 온도 라벨 -->
    <div v-if="showLabels" class="label-overlay">
      <div
        v-for="label in labelCoords"
        :key="label.id"
        class="planet-label"
        :class="{ hovered: hoveredPlanet === label.id, earth: label.id === 'earth' }"
        :style="{
          left: `${label.x}px`,
          top: `${label.y}px`,
          opacity: label.visible ? 1 : 0,
          borderColor: label.color,
        }"
      >
        <span class="label-name">{{ label.name }}</span>
        <span class="label-temp" :style="{ color: label.color }">{{ label.temp }}</span>
        <span v-if="label.id === 'earth'" class="label-hint">🌍 클릭 → 날씨</span>
      </div>
    </div>

    <!-- 하단 힌트 -->
    <div class="bottom-hint">
      <span>🖱️ 드래그: 회전 · 스크롤: 줌 · 클릭: 행성 탐색</span>
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

.brand-icon {
  font-size: 28px;
}

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

.label-toggle:hover,
.label-toggle.active {
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

/* ── 행성 라벨 오버레이 ── */
.label-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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

.planet-label.earth {
  border-color: #3b82f6 !important;
  background: rgba(29, 78, 216, 0.3);
}

.label-name {
  font-size: 11px;
  font-weight: 700;
  color: #e2e8f0;
}

.label-temp {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: -0.3px;
}

.label-hint {
  font-size: 9px;
  color: #93c5fd;
  margin-top: 1px;
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

@media (max-width: 768px) {
  .solar-topbar {
    flex-direction: column;
    align-items: flex-start;
  }
  .brand-sub {
    display: none;
  }
  .solar-controls {
    flex-wrap: wrap;
  }
}
</style>
