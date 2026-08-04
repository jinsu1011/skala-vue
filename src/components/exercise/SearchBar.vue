<script setup>
// 부모가 소유한 검색어를 '읽기 전용'으로 내려받는다. 자식은 절대 수정하지 않는다.
defineProps({
  query: {
    type: String,
    default: '',
  },
  resultCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update-query'])

// 직접 바꾸지 않고 "이 값으로 바꿔주세요" 하고 부모에게 요청만 한다. (Events Up)
const handleInput = (e) => {
  emit('update-query', e.target.value)
}

const clearQuery = () => {
  emit('update-query', '')
}
</script>

<template>
  <div class="search-bar">
    <div class="search-field">
      <span class="search-icon">🔍</span>
      <!--
        v-model 대신 :value + @input 을 쓰는 이유
        → v-model 은 한글 조합(IME) 중에는 값을 갱신하지 않아 'ㅅ', '서' 단계에서 검색이 안 된다.
      -->
      <input
        :value="query"
        placeholder="지역명을 검색하세요 (예: 서울, 부산)"
        @input="handleInput"
      />
      <button v-if="query" class="clear-btn" type="button" @click="clearQuery">✕</button>
    </div>

    <p v-if="query" class="search-status">
      '<strong>{{ query }}</strong
      >' 검색 결과 <strong>{{ resultCount }}</strong
      >건
    </p>
  </div>
</template>

<style scoped>
.search-field {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f4f6f9;
  border: 1px solid #e8ecf1;
  border-radius: 999px;
  padding: 10px 16px;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}
.search-field:focus-within {
  background: #fff;
  border-color: #a9cbf0;
  box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
}
.search-icon {
  font-size: 0.95rem;
  opacity: 0.6;
}
input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.95rem;
  color: #1f2937;
}
input::placeholder {
  color: #a8b1bc;
}
.clear-btn {
  border: none;
  background: #d5dbe3;
  color: #fff;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 0.62rem;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
}
.clear-btn:hover {
  background: #b9c2cd;
}
.search-status {
  font-size: 0.8rem;
  color: #8b95a1;
  margin: 8px 4px 0;
}
.search-status strong {
  color: #1e88e5;
  font-weight: 600;
}
</style>
