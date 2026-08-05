<script setup>
/*
 * [Code Challenge p.226] 실습 2. 커머스 상품 수량 및 평점 시스템
 * - el-card, el-input-number, el-rate
 * - 실시간 장부 요약 (computed 활용)
 */
import { ref } from 'vue'

const productQuantity = ref(1)
const productRate = ref(4)
</script>

<template>
  <el-card class="practice-card" shadow="hover">
    <template #header>
      <span>🛒 실습 2. 커머스 상품 수량 및 평점 시스템</span>
    </template>

    <div class="form-row">
      <span class="label">구매 수량 선택:</span>
      <el-input-number v-model="productQuantity" :min="1" :max="10" />
      <span class="hint">(최대 10개 구매 가능)</span>
    </div>

    <div class="form-row">
      <span class="label">상품 만족도 별점:</span>
      <el-rate v-model="productRate" show-score />
      <span class="score">{{ productRate }}점</span>
    </div>

    <el-alert type="success" :closable="false" show-icon style="margin-top: 16px">
      <template #title>
        실시간 장부 요약: 선택 수량 {{ productQuantity }}개 / 내가 준 점수 {{ productRate }}점
      </template>
    </el-alert>
  </el-card>
</template>

<style scoped>
.practice-card {
  max-width: 520px;
  margin: 16px 0;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.label {
  font-weight: 600;
  font-size: 0.92rem;
  white-space: nowrap;
}
.hint {
  font-size: 0.82rem;
  color: #999;
}
.score {
  font-weight: 700;
  font-size: 0.9rem;
}
</style>
