<script setup>
/*
 * [Code Challenge p.225] 실습 1. 회원가입 Form & 인풋 제어
 * - el-card, el-input, el-switch, el-button
 * - ElMessage 로 유효성 검사 피드백
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const userForm = ref({
  email: '',
  agree: false,
})

const handleRegister = () => {
  if (!userForm.value.email.includes('@')) {
    ElMessage.error('✘ 올바른 이메일 형식이 아닙니다.')
    return
  }
  if (!userForm.value.agree) {
    ElMessage.warning('⚠ 이용약관에 동의해야 합니다.')
    return
  }
  ElMessage.success('🎉 가입 신청이 정상적으로 완료되었습니다!')
}
</script>

<template>
  <el-card class="practice-card" shadow="hover">
    <template #header>
      <span>📋 실습 1. 회원가입 Form &amp; 인풋 제어</span>
    </template>

    <el-form label-position="left" label-width="80px">
      <el-form-item label="이메일 주소:">
        <el-input v-model="userForm.email" placeholder="example@email.com" clearable />
      </el-form-item>

      <el-form-item>
        <el-switch v-model="userForm.agree" />
        <span style="margin-left: 8px; font-size: 0.9rem">
          개인정보 수집 및 필수 이용약관에 동의합니다.
        </span>
      </el-form-item>

      <el-form-item>
        <el-button type="success" style="width: 100%" @click="handleRegister">
          ✏️ 회원가입하기
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.practice-card {
  max-width: 480px;
  margin: 16px 0;
}
</style>
