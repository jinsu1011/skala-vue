<script setup>
/**
 * ⭐ "내가 저장한 도시" Quick Bar
 *
 * 지구본 화면 좌측 하단에 떠 있는 즐겨찾기 바로가기 바입니다.
 * 칩(chip)을 한 번만 클릭하면 해당 도시로 카메라가 비행합니다.
 */
import { useWeatherStore } from '@/stores/weatherStore'

const emit = defineEmits(['select-city'])

const weatherStore = useWeatherStore()
</script>

<template>
  <!-- 즐겨찾기가 하나도 없으면 바 자체를 렌더링하지 않습니다 -->
  <aside v-if="weatherStore.favoriteCities.length > 0" class="quick-bar">
    <div class="quick-bar-head">
      <span class="quick-bar-title">⭐ 내가 저장한 도시</span>
      <button class="clear-btn" title="즐겨찾기 모두 지우기" @click="weatherStore.clearFavorites()">
        비우기
      </button>
    </div>

    <div class="chip-scroller">
      <button
        v-for="city in weatherStore.favoriteCities"
        :key="city.id"
        class="fav-chip"
        :class="{ selected: weatherStore.selectedCityId === city.id }"
        @click="emit('select-city', city.id)"
      >
        <span class="chip-icon">{{ city.icon }}</span>
        <span class="chip-name">{{ city.name }}</span>
        <!-- temp가 null이면(아직 로딩 전) 온도 자리를 '--'로 표시 -->
        <span class="chip-temp">
          {{ city.temp === null ? '--' : weatherStore.convertTemp(city.temp) }}°
        </span>
        <!-- 칩 안에서 바로 즐겨찾기 해제도 가능하도록 작은 별 버튼을 붙입니다 -->
        <span
          class="chip-remove"
          role="button"
          tabindex="0"
          title="즐겨찾기 해제"
          @click.stop="weatherStore.toggleFavorite(city.id)"
          @keydown.enter.stop="weatherStore.toggleFavorite(city.id)"
        >
          ✕
        </span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.quick-bar {
  position: absolute;
  left: 20px;
  bottom: 24px;
  z-index: 40;
  max-width: min(420px, calc(100vw - 40px));
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.68);
  backdrop-filter: blur(18px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.4);
  animation: quickBarIn 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes quickBarIn {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.quick-bar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.quick-bar-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: rgba(255, 255, 255, 0.75);
}

.clear-btn {
  padding: 3px 9px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  color: #fca5a5;
  border-color: rgba(252, 165, 165, 0.5);
}

.chip-scroller {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.fav-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 7px 10px 7px 12px;
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  color: #f1f5f9;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.fav-chip:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  transform: translateY(-2px);
}

/* 현재 보고 있는 도시는 파란 테두리로 강조 */
.fav-chip.selected {
  background: rgba(56, 189, 248, 0.25);
  border-color: #38bdf8;
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.4);
}

.chip-icon {
  font-size: 15px;
}

.chip-name {
  font-weight: 600;
}

.chip-temp {
  color: #38bdf8;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.chip-remove {
  margin-left: 2px;
  padding: 0 3px;
  color: rgba(255, 255, 255, 0.35);
  font-size: 11px;
  border-radius: 6px;
}

.chip-remove:hover {
  color: #fca5a5;
}

@media (max-width: 768px) {
  .quick-bar {
    left: 12px;
    right: 12px;
    bottom: 78px;
    max-width: none;
  }
}
</style>
