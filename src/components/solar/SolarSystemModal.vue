<script setup>
import { ref } from 'vue'

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

// 태양계 주요 천체 표면 온도 데이터
const solarBodies = [
  {
    name: '태양 (Sun)',
    icon: '☀️',
    temp: '5,500 °C',
    color: '#ef4444',
    bg: 'linear-gradient(135deg, #f97316, #ef4444)',
    desc: '태양계의 중심. 표면 온도는 약 5,500°C, 중심 핵은 1,500만°C에 달합니다.',
    category: '항성',
  },
  {
    name: '수성 (Mercury)',
    icon: '☿️',
    temp: '-180 ~ 430 °C',
    color: '#94a3b8',
    bg: 'linear-gradient(135deg, #64748b, #475569)',
    desc: '대기가 거의 없어 낮에는 430°C까지 치솟고 밤에는 -180°C까지 급강하합니다.',
    category: '행성',
  },
  {
    name: '금성 (Venus)',
    icon: '♀️',
    temp: '약 464 °C',
    color: '#facc15',
    bg: 'linear-gradient(135deg, #eab308, #ca8a04)',
    desc: '두꺼운 이산화탄소 대기의 온실효과로 태양계에서 가장 뜨거운 행성입니다.',
    category: '행성',
  },
  {
    name: '지구 (Earth)',
    icon: '🌍',
    temp: '평균 15 °C',
    color: '#38bdf8',
    bg: 'linear-gradient(135deg, #0284c7, #2563eb)',
    desc: '액체 상태의 물과 적절한 대기로 생명체가 살기 최적인 평균 15°C를 유지합니다.',
    category: '행성',
  },
  {
    name: '화성 (Mars)',
    icon: '♂️',
    temp: '-140 ~ 20 °C',
    color: '#f97316',
    bg: 'linear-gradient(135deg, #ea580c, #c2410c)',
    desc: '옅은 대기와 붉은 흙의 붉은 행성. 평균 온도는 약 -62°C의 춥고 건조한 환경입니다.',
    category: '행성',
  },
  {
    name: '목성 (Jupiter)',
    icon: '♃',
    temp: '약 -110 °C',
    color: '#fbbf24',
    bg: 'linear-gradient(135deg, #d97706, #b45309)',
    desc: '태양계 최대 거대 가스 행성. 상층 대기 구름 온도는 약 -110°C입니다.',
    category: '행성',
  },
  {
    name: '토성 (Saturn)',
    icon: '♄',
    temp: '약 -140 °C',
    color: '#fde047',
    bg: 'linear-gradient(135deg, #ca8a04, #854d0e)',
    desc: '아름다운 얼음 고리를 가진 가스 행성. 평균 표면 구름 온도는 -140°C입니다.',
    category: '행성',
  },
  {
    name: '천왕성 (Uranus)',
    icon: '♅',
    temp: '약 -195 °C',
    color: '#22d3ee',
    bg: 'linear-gradient(135deg, #0891b2, #0e7490)',
    desc: '메탄 대기로 청록색을 띠는 얼음 거인. 내부 열이 적어 가장 추운 행성 중 하나입니다.',
    category: '행성',
  },
  {
    name: '해왕성 (Neptune)',
    icon: '♆',
    temp: '약 -200 °C',
    color: '#60a5fa',
    bg: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
    desc: '태양에서 가장 먼 푸른 얼음 행성. 초속 2,100km의 강력한 폭풍과 -200°C의 극한 추위입니다.',
    category: '행성',
  },
]

const activeIndex = ref(0)
</script>

<template>
  <Transition name="solar-fade">
    <div v-if="isOpen" class="solar-modal-overlay" @click.self="emit('close')">
      <div class="solar-modal-content">
        <!-- 상단 헤더 -->
        <div class="solar-header">
          <div class="solar-title-group">
            <span class="header-icon">☀️</span>
            <h2>태양계 천체 표면온도 비교 뷰</h2>
          </div>
          <button class="close-btn" @click="emit('close')">✕</button>
        </div>

        <p class="solar-subtext">
          클릭 한 번으로 태양과 8대 행성의 표면 온도를 한눈에 비교해보세요!
        </p>

        <!-- 태양계 비주얼 스트립 (클릭 한 번으로 선택) -->
        <div class="solar-strip">
          <button
            v-for="(body, idx) in solarBodies"
            :key="body.name"
            class="solar-strip-item"
            :class="{ active: activeIndex === idx }"
            @click="activeIndex = idx"
          >
            <span class="strip-icon">{{ body.icon }}</span>
            <span class="strip-name">{{ body.name.split(' ')[0] }}</span>
            <span class="strip-temp" :style="{ color: body.color }">{{ body.temp }}</span>
          </button>
        </div>

        <!-- 선택된 천체 하이라이트 카드 -->
        <div class="solar-active-card" :style="{ background: solarBodies[activeIndex].bg }">
          <div class="active-card-left">
            <span class="active-icon">{{ solarBodies[activeIndex].icon }}</span>
          </div>
          <div class="active-card-right">
            <div class="active-badge">{{ solarBodies[activeIndex].category }}</div>
            <h3 class="active-name">{{ solarBodies[activeIndex].name }}</h3>
            <div class="active-temp-val">표면 온도: {{ solarBodies[activeIndex].temp }}</div>
            <p class="active-desc">{{ solarBodies[activeIndex].desc }}</p>
          </div>
        </div>

        <!-- 태양계 전체 온도 한눈에 보기 그리드 -->
        <div class="solar-grid-title">🌌 태양계 전체 온도 한눈에 보기</div>
        <div class="solar-grid">
          <div
            v-for="(body, idx) in solarBodies"
            :key="`grid-${body.name}`"
            class="solar-grid-item"
            :class="{ selected: activeIndex === idx }"
            @click="activeIndex = idx"
          >
            <div class="grid-top">
              <span class="grid-icon">{{ body.icon }}</span>
              <span class="grid-name">{{ body.name.split(' ')[0] }}</span>
            </div>
            <div class="grid-temp-badge" :style="{ borderColor: body.color, color: body.color }">
              {{ body.temp }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.solar-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(2, 6, 23, 0.85);
  backdrop-filter: blur(16px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.solar-modal-content {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 28px;
  padding: 28px;
  color: #fff;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
}

.solar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.solar-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 24px;
}

.solar-header h2 {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #fde047 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.solar-subtext {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin: 6px 0 20px 0;
}

.solar-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 12px;
  scrollbar-width: thin;
}

.solar-strip-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.solar-strip-item.active,
.solar-strip-item:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: #facc15;
  transform: translateY(-2px);
}

.strip-icon {
  font-size: 24px;
}

.strip-name {
  font-size: 12px;
  font-weight: 600;
}

.strip-temp {
  font-size: 10px;
  font-weight: 700;
}

.solar-active-card {
  margin-top: 20px;
  padding: 24px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
}

.active-icon {
  font-size: 72px;
}

.active-badge {
  display: inline-block;
  padding: 3px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 6px;
}

.active-name {
  font-size: 24px;
  font-weight: 800;
}

.active-temp-val {
  font-size: 18px;
  font-weight: 700;
  margin: 6px 0 8px 0;
  color: #fff;
}

.active-desc {
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.9;
}

.solar-grid-title {
  font-size: 14px;
  font-weight: 700;
  margin: 24px 0 12px 0;
  color: rgba(255, 255, 255, 0.8);
}

.solar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 640px) {
  .solar-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.solar-grid-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.solar-grid-item:hover,
.solar-grid-item.selected {
  background: rgba(255, 255, 255, 0.15);
  border-color: #facc15;
}

.grid-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid-icon {
  font-size: 18px;
}

.grid-name {
  font-size: 13px;
  font-weight: 600;
}

.grid-temp-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border: 1px solid;
  border-radius: 8px;
}

.solar-fade-enter-active,
.solar-fade-leave-active {
  transition: opacity 0.3s ease;
}

.solar-fade-enter-from,
.solar-fade-leave-to {
  opacity: 0;
}
</style>
