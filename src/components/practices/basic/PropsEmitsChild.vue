<script setup>
defineProps({
  parentData: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update-request'])

const sendNotification = () => {
  const payload = 'Child에서 가공한 새로운 데이터'
  emit('update-request', payload)
}
</script>

<template>
  <div
    class="child-container"
    style="border: 1px solid #35495e; padding: 10px; border-radius: 6px; margin-top: 10px"
  >
    <h4>하위 컴포넌트 (Child)</h4>
    <p>
      수신된 Props 데이터: <strong>{{ parentData }}</strong>
    </p>
    <button type="button" @click="sendNotification">상위 컴포넌트로 갱신 요청 (Emit)</button>
  </div>
</template>
