<script setup>
/*
 * ══════════════════════════════════════════════════════════════
 *  [Code Challenge p.207 / p.208] Axios JSON Example (AxiosJson.vue)
 *   - JSONPlaceholder 예제를 통해 REST API CRUD 처리 코드 확인
 * ══════════════════════════════════════════════════════════════
 *
 *  HTTP 메서드 ↔ DB CRUD 매핑 (강의자료 193p)
 *    GET    = Read   (조회)   POST   = Create (생성)
 *    PUT    = Update (수정)   DELETE = Delete (삭제)
 *
 *  ⚠️ JSONPlaceholder 는 '가짜' 서버라서 POST/PUT/DELETE 를 보내면
 *     성공 응답은 정상으로 주지만 실제 DB 는 바뀌지 않는다.
 *     그래서 화면 목록은 우리가 직접 갱신해 준다. (실무에서도 흔한 패턴)
 */
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 💡 1. 백엔드 공용 주소
const BASE_URL = 'https://jsonplaceholder.typicode.com/posts'

// 💡 2. 반응형 상태 데이터
const items = ref([]) // 서버에서 받아온 데이터 배열 박스
const textInput = ref('') // 입력창과 연결된 글자 데이터 박스
const logMessage = ref('')

// --------------------------------------------------
// [READ] GET : 데이터 가져오기
// --------------------------------------------------
const handleRead = async () => {
  try {
    // 공부용으로 딱 3개만 들고 옵니다. (?_limit=3 쿼리스트링)
    const response = await axios.get(BASE_URL, { params: { _limit: 3 } })
    items.value = response.data
    logMessage.value = `GET 성공 — ${response.data.length}건 조회`
    console.log('GET 성공:', response.data)
  } catch (error) {
    logMessage.value = `GET 실패: ${error.message}`
    console.error('GET 실패:', error)
  }
}

// --------------------------------------------------
// [CREATE] POST : 데이터 등록 (Body 에 담아 보낸다)
// --------------------------------------------------
const handleCreate = async () => {
  if (!textInput.value.trim()) {
    logMessage.value = '저장할 텍스트를 먼저 입력하세요.'
    return
  }

  try {
    const response = await axios.post(BASE_URL, {
      title: textInput.value,
      body: '날씨현황',
      userId: 1,
    })
    // 서버는 보낸 데이터에 id: 101 을 붙여서 돌려준다.
    items.value.unshift(response.data)
    textInput.value = ''
    logMessage.value = `POST 성공 — 새 id: ${response.data.id}`
    console.log('POST 성공:', response.data)
  } catch (error) {
    logMessage.value = `POST 실패: ${error.message}`
  }
}

// --------------------------------------------------
// [UPDATE] PUT : 데이터 전체 수정
// --------------------------------------------------
const handleUpdate = async (item) => {
  /*
   * ⚠️ JSONPlaceholder 는 실제로 저장을 안 하므로 POST 로 갓 만든 id(101)에
   *    PUT 을 보내면 서버가 500 을 뱉는다. 우리 코드 잘못이 아니라
   *    '가짜 서버'가 1~100번 글만 알고 있기 때문이다.
   */
  if (item.id > 100) {
    logMessage.value = `id ${item.id} 은 POST 로 방금 만든 가짜 데이터라 PUT 을 지원하지 않습니다. (1~100번만 가능)`
    return
  }

  try {
    const response = await axios.put(`${BASE_URL}/${item.id}`, {
      title: `${item.title} (수정됨)`,
      body: '수정현황',
    })
    // 화면 목록에서 해당 항목만 갈아끼운다
    const index = items.value.findIndex((row) => row.id === item.id)
    if (index !== -1) {
      items.value[index] = { ...item, title: response.data.title }
    }
    logMessage.value = `PUT 성공 — id ${item.id} 수정`
  } catch (error) {
    logMessage.value = `PUT 실패: ${error.message}`
  }
}

// --------------------------------------------------
// [DELETE] DELETE : 데이터 삭제 (성공 시 빈 객체 반환)
// --------------------------------------------------
const handleDelete = async (item) => {
  try {
    await axios.delete(`${BASE_URL}/${item.id}`)
    items.value = items.value.filter((row) => row.id !== item.id)
    logMessage.value = `DELETE 성공 — id ${item.id} 삭제`
  } catch (error) {
    logMessage.value = `DELETE 실패: ${error.message}`
  }
}

// 화면이 DOM 에 붙는 순간 목록을 한 번 불러온다
onMounted(handleRead)
</script>

<template>
  <div class="practice-section">
    <h2>⚡ Axios CRUD 프로토타입 훈련</h2>

    <div class="input-row">
      <input
        v-model="textInput"
        placeholder="저장할 텍스트를 입력하세요"
        @keyup.enter="handleCreate"
      />
      <button type="button" class="btn-post" @click="handleCreate">POST (추가)</button>
    </div>

    <div v-for="item in items" :key="item.id" class="post-row">
      <div class="post-body">
        <div class="post-id">ID: {{ item.id }}</div>
        <div class="post-title">{{ item.title }}</div>
      </div>
      <button type="button" class="btn-put" @click="handleUpdate(item)">PUT (수정)</button>
      <button type="button" class="btn-del" @click="handleDelete(item)">DEL (삭제)</button>
    </div>

    <div class="footer-row">
      <button type="button" class="btn-get" @click="handleRead">GET (다시 조회)</button>
      <span v-if="logMessage" class="log">{{ logMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
.input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.input-row input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #dde3ea;
  border-radius: 6px;
  font-size: 0.86rem;
}

.post-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: #f8fafc;
  border: 1px solid #eceff3;
  border-radius: 8px;
}
.post-body {
  flex: 1;
  min-width: 0;
}
.post-id {
  font-size: 0.68rem;
  color: #94a3b8;
}
.post-title {
  font-size: 0.86rem;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

button {
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 0.74rem;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
}
.btn-post {
  background: #16a34a;
}
.btn-put {
  background: #eab308;
}
.btn-del {
  background: #ef4444;
}
.btn-get {
  background: #3b82f6;
}

.footer-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}
.log {
  font-size: 0.76rem;
  color: #64748b;
}
</style>
