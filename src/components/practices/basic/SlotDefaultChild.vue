<template>
  <div class="base-card">
    <!-- 부모가 아무것도 안 넣으면 <slot> 안의 내용이 기본값(fallback)으로 표시된다 -->
    <slot>
      <p>기본 콘텐츠 영역입니다.</p>
    </slot>
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
</style>
