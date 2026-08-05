<script setup>
/**
 * 🪐 PlanetDetailView — 개별 행성 3D 탐색 뷰
 *
 * 선택한 행성의 3D 구체를 전체 화면으로 렌더링하고,
 * 마우스 드래그로 360° 회전, 줌인/아웃이 가능하다.
 * 옆에 행성 정보 패널(표면온도, 지름, 질량 등)을 표시한다.
 *
 * 비유: 기존 날씨 지구본 화면에서 "지구" 대신 다른 행성을 보는 화면.
 */
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPlanetById } from '@/data/planetData'
import { usePlanetGlobe } from '@/composables/usePlanetGlobe'

const route = useRoute()
const router = useRouter()

// URL 파라미터로부터 행성 데이터 가져오기
const planet = computed(() => getPlanetById(route.params.planetId))

const containerRef = ref(null)
const showInfo = ref(true)

const { initPlanetGlobe, cleanup } = usePlanetGlobe()

// 행성이 바뀌면 3D 씬 재초기화
watch(
  () => route.params.planetId,
  async () => {
    cleanup()
    await nextTick()
    if (containerRef.value && planet.value) {
      initPlanetGlobe(containerRef.value, planet.value)
    }
  },
)

onMounted(async () => {
  await nextTick()
  if (containerRef.value && planet.value) {
    initPlanetGlobe(containerRef.value, planet.value)
  }
})

// 태양계로 돌아가기
const goBack = () => router.push({ name: 'SolarSystem' })

// 정보 타일 데이터
const infoTiles = computed(() => {
  if (!planet.value) return []
  const p = planet.value
  return [
    { label: '표면 온도', value: p.surfaceTemp, icon: '🌡️' },
    { label: '지름', value: p.diameterKm, icon: '📏' },
    { label: '질량', value: p.mass, icon: '⚖️' },
    { label: '공전 주기', value: p.orbitalPeriod, icon: '🔄' },
    { label: '자전 주기', value: p.rotationPeriod, icon: '🌀' },
    { label: '표면 중력', value: p.gravity, icon: '🏋️' },
    { label: '대기 구성', value: p.atmosphere, icon: '💨' },
  ]
})
</script>

<template>
  <div class="planet-detail-view">
    <!-- 3D 행성 Canvas -->
    <div ref="containerRef" class="planet-canvas"></div>

    <!-- 상단 네비게이션 -->
    <header class="planet-topbar">
      <button class="back-btn" @click="goBack">← 태양계로 돌아가기</button>

      <div v-if="planet" class="planet-name-bar">
        <span class="planet-icon">{{ planet.icon }}</span>
        <h1 class="planet-title">{{ planet.name }} ({{ planet.nameEn }})</h1>
        <span class="planet-badge">{{ planet.category }}</span>
      </div>

      <button class="info-toggle" :class="{ active: showInfo }" @click="showInfo = !showInfo">
        {{ showInfo ? '📋 정보 숨기기' : '📋 정보 보기' }}
      </button>
    </header>

    <!-- 행성 정보 패널 (우측 사이드바) -->
    <Transition name="panel-slide">
      <aside v-if="showInfo && planet" class="planet-info-panel">
        <!-- 핵심 온도 하이라이트 -->
        <div class="temp-highlight" :style="{ borderColor: planet.colorHex }">
          <span class="temp-label">표면 온도</span>
          <span class="temp-value" :style="{ color: planet.colorHex }">{{
            planet.surfaceTemp
          }}</span>
        </div>

        <!-- 설명 -->
        <p class="planet-desc">{{ planet.description }}</p>

        <!-- 정보 타일 그리드 -->
        <div class="info-grid">
          <div v-for="tile in infoTiles" :key="tile.label" class="info-tile">
            <span class="tile-icon">{{ tile.icon }}</span>
            <div class="tile-body">
              <span class="tile-label">{{ tile.label }}</span>
              <span class="tile-value">{{ tile.value }}</span>
            </div>
          </div>
        </div>

        <!-- 재미있는 사실 -->
        <div class="fun-fact">
          <span class="fact-badge">💡 알고 계셨나요?</span>
          <p>{{ planet.funFact }}</p>
        </div>
      </aside>
    </Transition>

    <!-- 404: 존재하지 않는 행성 -->
    <div v-if="!planet" class="planet-not-found">
      <h2>🪐 해당 행성을 찾을 수 없습니다</h2>
      <button @click="goBack">태양계로 돌아가기</button>
    </div>

    <!-- 하단 힌트 -->
    <div class="bottom-hint">🖱️ 드래그: 행성 회전 · 스크롤: 줌 · 자동 회전 중</div>
  </div>
</template>

<style scoped>
.planet-detail-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #020617;
}

.planet-canvas {
  width: 100%;
  height: 100%;
}

/* ── 상단 바 ── */
.planet-topbar {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 18px;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  color: #fff;
  z-index: 100;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
}

.back-btn {
  padding: 7px 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.planet-name-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.planet-icon {
  font-size: 24px;
}

.planet-title {
  font-size: 18px;
  font-weight: 800;
  color: #f8fafc;
}

.planet-badge {
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.info-toggle {
  padding: 7px 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.info-toggle:hover,
.info-toggle.active {
  background: rgba(255, 255, 255, 0.2);
}

/* ── 우측 정보 패널 ── */
.planet-info-panel {
  position: absolute;
  top: 80px;
  right: 16px;
  width: 340px;
  max-height: calc(100vh - 130px);
  overflow-y: auto;
  padding: 20px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 22px;
  color: #fff;
  z-index: 90;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
}

.temp-highlight {
  text-align: center;
  padding: 16px;
  border: 2px solid;
  border-radius: 18px;
  background: rgba(0, 0, 0, 0.3);
  margin-bottom: 16px;
}

.temp-label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.temp-value {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.5px;
}

.planet-desc {
  font-size: 13px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 18px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.info-tile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
}

.tile-icon {
  font-size: 18px;
}

.tile-body {
  display: flex;
  flex-direction: column;
}

.tile-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.tile-value {
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
}

.fun-fact {
  padding: 14px;
  background: rgba(250, 204, 21, 0.08);
  border: 1px solid rgba(250, 204, 21, 0.2);
  border-radius: 14px;
}

.fact-badge {
  display: inline-block;
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

/* ── 404 ── */
.planet-not-found {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #fff;
  z-index: 100;
}

.planet-not-found button {
  margin-top: 16px;
  padding: 10px 24px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 14px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
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

/* ── 패널 슬라이드 트랜지션 ── */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.3s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

@media (max-width: 768px) {
  .planet-info-panel {
    top: auto;
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    max-height: 55vh;
    border-radius: 22px 22px 0 0;
  }

  .planet-topbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
