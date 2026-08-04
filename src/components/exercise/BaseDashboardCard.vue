<script setup>
import { ref } from 'vue'

// [추가 실습] 카드 접기/펼치기 상태는 '카드 자신'이 소유한다.
const isOpen = ref(true)
const toggle = () => {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <section class="base-dashboard-card">
    <!--
      [추가 실습] Scoped Slot (강의자료 156p)
      자식(카드)이 가진 open/toggle 을 부모에게 '빌려준다'.
      → 부모는 헤더 디자인을 마음대로 짜면서 카드의 접힘 기능을 제어할 수 있다.
    -->
    <header v-if="$slots.header" class="card-header">
      <slot name="header" :open="isOpen" :toggle="toggle"></slot>
    </header>

    <!-- v-show: DOM 은 남기고 display 만 끔 (v-if 와 달리 재생성 비용 없음) -->
    <div v-show="isOpen" class="card-body">
      <slot></slot>
    </div>
  </section>
</template>

<style scoped>
.base-dashboard-card {
  border: 1px solid #e9edf2;
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 14px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(16, 40, 80, 0.04);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
/* 슬롯으로 들어온 콘텐츠까지 스타일을 적용하려면 :deep() 이 필요하다 */
.card-header :deep(h3) {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
