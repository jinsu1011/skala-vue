<script setup>
import { ref } from 'vue'

// 자식이 소유한 데이터. 이걸 슬롯 속성으로 부모에게 '빌려준다'.
const message = ref('현재 서버 상태 정상')
const userCount = ref(150)
</script>

<template>
  <div class="base-card">
    <h3>하위 컴포넌트 (Child)</h3>

    <!-- :이름="변수" 로 바인딩하면 부모가 v-slot="슬롯주머니" 로 꺼내 쓸 수 있다 -->
    <slot :count="userCount" :text="message">
      <p>부모가 마크업을 주입하지 않았을 때의 디폴트 화면</p>
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
h3 {
  margin-top: 0;
  font-size: 1rem;
}
</style>
