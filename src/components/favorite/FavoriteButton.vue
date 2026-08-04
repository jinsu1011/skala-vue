<script setup>
/**
 * ⭐ 즐겨찾기 토글 버튼 (재사용 가능한 작은 단위 컴포넌트)
 *
 * "컴포넌트 분리 원칙":
 * 이 버튼은 헤더 카드에도, 검색 결과에도, Quick Bar에도 붙을 수 있습니다.
 * 그래서 자신의 상태를 스스로 갖지 않고(스토어에서 읽고),
 * 어떤 도시인지만 props(cityId)로 받도록 만들어 어디서든 재사용됩니다.
 */
import { computed } from 'vue'
import { useWeatherStore } from '@/stores/weatherStore'

const props = defineProps({
  cityId: {
    type: String,
    required: true,
  },
  // 'lg'(상세 헤더용) | 'sm'(목록/칩 안에 들어가는 작은 버튼)
  size: {
    type: String,
    default: 'lg',
  },
})

const weatherStore = useWeatherStore()

// 스토어의 getter를 이용해 "지금 이 도시가 즐겨찾기인지" 실시간 계산
const active = computed(() => weatherStore.isFavorite(props.cityId))

const handleClick = () => {
  weatherStore.toggleFavorite(props.cityId)
}
</script>

<template>
  <button
    class="fav-btn"
    :class="[size, { active }]"
    :title="active ? '즐겨찾기에서 제거' : '즐겨찾기에 추가'"
    :aria-pressed="active"
    aria-label="즐겨찾기 토글"
    @click.stop="handleClick"
  >
    <!-- 채워진 별 / 빈 별을 상태에 따라 전환 -->
    <span class="star">{{ active ? '★' : '☆' }}</span>
  </button>
</template>

<style scoped>
.fav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.65);
  cursor: pointer;
  transition:
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    background 0.2s ease,
    color 0.2s ease;
}

.fav-btn.lg {
  width: 40px;
  height: 40px;
  font-size: 20px;
}

.fav-btn.sm {
  width: 24px;
  height: 24px;
  font-size: 13px;
  border: none;
  background: transparent;
}

.fav-btn:hover {
  transform: scale(1.15);
  background: rgba(250, 204, 21, 0.18);
  color: #facc15;
}

/* 즐겨찾기 상태일 때 노란 별 + 은은한 발광 */
.fav-btn.active {
  color: #facc15;
  border-color: rgba(250, 204, 21, 0.5);
  text-shadow: 0 0 12px rgba(250, 204, 21, 0.8);
}

.fav-btn.active .star {
  animation: starPop 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes starPop {
  0% {
    transform: scale(0.5) rotate(-30deg);
  }
  60% {
    transform: scale(1.3) rotate(8deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}
</style>
