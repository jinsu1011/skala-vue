<template>
  <div class="base-card">
    <!-- 부모가 #header 를 안 주면 빈 <header></header> 가 DOM 에 남으므로 v-if 로 방어 -->
    <header v-if="$slots.header">
      <slot name="header"></slot>
    </header>

    <main>
      <slot></slot>
    </main>
  </div>
</template>

<style scoped>
.base-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 10px;
  background: #fff;
}
header {
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
}
</style>
