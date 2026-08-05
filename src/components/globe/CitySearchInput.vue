<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { CITIES } from '@/api/weatherApi'
import FavoriteButton from '@/components/favorite/FavoriteButton.vue'

const emit = defineEmits(['select-city'])

const query = ref('')
const isOpen = ref(false)
const selectedIndex = ref(-1)
const searchInputRef = ref(null)
const notSupportedMessage = ref('')

// 검색어 입력 핸들러 (IME 한글 조합 대응)
const handleInput = (e) => {
  query.value = e.target.value
  isOpen.value = true
  selectedIndex.value = -1
  notSupportedMessage.value = ''
}

// 자동완성 필터링 (한글명 및 영문명 검색)
const filteredCities = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.englishName.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q) ||
      (c.aliases && c.aliases.some((alias) => alias.toLowerCase().includes(q))),
  )
})

// 그룹화 (국내 🇰🇷 / 해외 🌏)
const groupedCities = computed(() => {
  const list = filteredCities.value
  const kr = list.filter((c) => c.countryGroup === 'KR')
  const int = list.filter((c) => c.countryGroup === 'INT')

  const groups = []
  if (kr.length > 0) groups.push({ title: '🇰🇷 국내 도시', items: kr })
  if (int.length > 0) groups.push({ title: '🌏 해외 주요 도시', items: int })
  return groups
})

// 전체 플랫 검색 결과 항목 목록 (키보드 인덱스용)
const flatResults = computed(() => {
  return filteredCities.value
})

// 키보드 조작 (↑, ↓, Enter, ESC)
const handleKeyDown = (e) => {
  if (!isOpen.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    isOpen.value = true
    return
  }

  const items = flatResults.value

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (items.length > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % items.length
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (items.length > 0) {
      selectedIndex.value = (selectedIndex.value - 1 + items.length) % items.length
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (selectedIndex.value >= 0 && selectedIndex.value < items.length) {
      onSelect(items[selectedIndex.value])
    } else if (items.length > 0) {
      onSelect(items[0])
    } else if (query.value.trim()) {
      // 미지원 지역 메시지
      notSupportedMessage.value = `'${query.value.trim()}'는 아직 지원하지 않는 지역입니다. (지원: 국내 8개 도시, 뉴욕·도쿄·런던·파리·베이징·모스크바·마드리드·LA)`
    }
  } else if (e.key === 'Escape') {
    isOpen.value = false
  }
}

// 도시 선택
const onSelect = (city) => {
  query.value = city.name
  isOpen.value = false
  selectedIndex.value = -1
  notSupportedMessage.value = ''
  emit('select-city', city.id)
}

// 외부 클릭 시 드롭다운 닫기
const handleClickOutside = (e) => {
  if (searchInputRef.value && !searchInputRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 쿼리가 비어있으면 메시지 초기화
watch(query, (val) => {
  if (!val.trim()) {
    notSupportedMessage.value = ''
  }
})
</script>

<template>
  <div ref="searchInputRef" class="search-input-container">
    <div class="input-wrapper">
      <span class="search-icon">🔍</span>
      <!-- v-model 대신 :value + @input 사용 (한글 IME 조합 문제 완전 방지) -->
      <input
        type="text"
        :value="query"
        placeholder="도시 또는 영문명 검색 (예: 서울, Tokyo)"
        class="search-input"
        @input="handleInput"
        @keydown="handleKeyDown"
        @focus="isOpen = true"
      />
      <button v-if="query" class="clear-btn" @click="query = ''">✕</button>
    </div>

    <!-- 자동완성 드롭다운 -->
    <div v-if="isOpen && query.trim() && flatResults.length > 0" class="autocomplete-dropdown">
      <div v-for="group in groupedCities" :key="group.title" class="dropdown-group">
        <div class="group-header">{{ group.title }}</div>
        <div
          v-for="city in group.items"
          :key="city.id"
          class="dropdown-item"
          :class="{ active: flatResults[selectedIndex]?.id === city.id }"
          @click="onSelect(city)"
        >
          <span class="item-name">{{ city.name }}</span>
          <span class="item-eng">{{ city.englishName }}</span>
          <!-- ⭐ 검색 결과에서 바로 즐겨찾기 추가/해제 -->
          <FavoriteButton :city-id="city.id" size="sm" class="item-fav" />
        </div>
      </div>
    </div>

    <!-- 미지원 지역 안내 -->
    <div v-if="notSupportedMessage" class="not-supported-popover">
      <span class="warn-icon">⚠️</span>
      <p>{{ notSupportedMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.search-input-container {
  position: relative;
  width: 320px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  transition: all 0.25s ease;
}

.input-wrapper:focus-within {
  border-color: #38bdf8;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.3);
  background: rgba(15, 23, 42, 0.85);
}

.search-icon {
  font-size: 14px;
  opacity: 0.7;
}

.search-input {
  width: 100%;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.clear-btn {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  cursor: pointer;
}

.clear-btn:hover {
  color: #fff;
}

.autocomplete-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
  z-index: 100;
  max-height: 280px;
  overflow-y: auto;
}

.dropdown-group {
  padding: 6px 0;
}

.group-header {
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.dropdown-item:hover,
.dropdown-item.active {
  background: rgba(56, 189, 248, 0.25);
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #f8fafc;
}

.item-eng {
  font-size: 12px;
  color: #94a3b8;
  /* 영문명이 남는 공간을 밀어내어 별 버튼이 항상 오른쪽 끝에 붙게 합니다 */
  margin-left: auto;
  margin-right: 8px;
}

.not-supported-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  background: rgba(225, 29, 72, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 14px;
  color: #fff;
  font-size: 12px;
  line-height: 1.4;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
  z-index: 100;
  animation: fadeIn 0.2s ease;
}

.warn-icon {
  font-size: 14px;
}

@media (max-width: 640px) {
  .search-input-container {
    width: 100%;
  }
}
</style>
