<script setup>
/*
 * [Code Challenge p.227] 실습 3. 시스템 피드백 & 프로그레스 인터랙션
 * - el-card, el-button, el-progress
 * - ElMessageBox.confirm 으로 삭제 확인
 * - setInterval 로 게이지 바 애니메이션
 */
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const downloadProgress = ref(0)
const isDownloading = ref(false)

const confirmDelete = () => {
  ElMessageBox.confirm(
    '서버에서 해당 파일을 영구히 삭제하시겠습니까?',
    '⚠ 최종 경고',
    {
      confirmButtonText: '네, 삭제합니다',
      cancelButtonText: '취소',
      type: 'danger',
    },
  )
    .then(() => {
      ElMessage.success('🗑 파일이 안전하게 파쇄되었습니다.')
    })
    .catch(() => {
      ElMessage.info('✘ 삭제 작업이 취소되었습니다.')
    })
}

const startDownload = () => {
  if (isDownloading.value) return (isDownloading.value = true)
  downloadProgress.value = 0
  isDownloading.value = true

  const interval = setInterval(() => {
    downloadProgress.value += 20
    if (downloadProgress.value >= 100) {
      clearInterval(interval)
      isDownloading.value = false
      ElMessage.success('💾 대용량 데이터 로드가 완료되었습니다!')
    }
  }, 400)
}
</script>

<template>
  <el-card class="practice-card" shadow="hover">
    <template #header>
      <span>⚙ 실습 3. 시스템 피드백 &amp; 프로그레스 인터랙션</span>
    </template>

    <div class="btn-row">
      <el-button type="warning" @click="confirmDelete">
        🗑 서버 파일 삭제 테스트
      </el-button>
      <el-button type="primary" :loading="isDownloading" @click="startDownload">
        💾 데이터 동기화 시작
      </el-button>
    </div>

    <el-progress
      :percentage="downloadProgress"
      :status="downloadProgress >= 100 ? 'success' : ''"
      :stroke-width="18"
      style="margin-top: 16px"
    />
  </el-card>
</template>

<style scoped>
.practice-card {
  max-width: 520px;
  margin: 16px 0;
}
.btn-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
