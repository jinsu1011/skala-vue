<script setup>
import { ref } from 'vue'

// 실행 순서를 눈으로 보기 위한 로그 (강의자료는 alert을 쓰지만,
// alert은 화면을 멈춰버려서 "버블링이 어떤 순서로 일어나는지"를 볼 수 없다.)
const logs = ref([])
const log = (text) => {
  logs.value.unshift(`${new Date().toLocaleTimeString()} — ${text}`)
  if (logs.value.length > 8) logs.value.pop()
}
const clearLogs = () => (logs.value = [])

const handleLink = () => log('✅ .prevent 덕분에 네이버로 이동하지 않고 함수만 실행됨')
const handleParent = () => log('🟦 부모 박스 클릭 이벤트 실행됨')
const handleOnce = () => log('🔒 .once — 이 메시지는 새로고침 전까지 딱 한 번만 나온다')

// 검색어 입력 후 엔터
const keyword = ref('')
const search = () => {
  if (!keyword.value.trim()) return
  log(`🔍 "${keyword.value}" 검색 실행 (.enter 수식어)`)
  keyword.value = ''
}
</script>

<template>
  <div class="practice-section">
    <h2>이벤트 수식어(Modifiers) 학습</h2>
    <p class="desc">
      수식어는 이벤트 뒤에 점(.)을 찍어 붙이는 접미어다. 원래 JavaScript로 여러 줄 써야 할 처리를 한
      단어로 끝낸다. (예: <code>@click.prevent</code> = <code>e.preventDefault()</code>)
    </p>

    <h3>1) .prevent — 태그의 기본 동작 막기</h3>
    <p class="desc">
      &lt;a&gt; 태그는 원래 누르면 페이지가 이동한다. .prevent를 붙이면 이동을 막고 내 함수만
      실행한다. (폼 제출 시 새로고침 방지에도 똑같이 쓴다)
    </p>
    <a href="https://www.naver.com" @click.prevent="handleLink">네이버 링크 (눌러도 이동 안 함)</a>
    <br />
    <a href="https://www.naver.com" target="_blank" @click="log('⚠️ 수식어 없음 — 새 탭이 열림')">
      비교용: 수식어 없는 링크 (새 탭으로 진짜 이동)
    </a>

    <h3>2) .stop — 이벤트 버블링 차단</h3>
    <p class="desc">
      버블링이란 자식을 클릭했을 때 그 이벤트가 <strong>부모에게까지 거슬러 올라가는</strong>
      현상이다. 아래 두 버튼을 각각 눌러 로그 개수를 비교해 보자.
    </p>
    <div class="parent-box" @click="handleParent">
      <p>부모 영역 (클릭 시 로그 발동)</p>
      <button @click="log('1️⃣ 자식 버튼 클릭 — 부모 로그도 같이 찍힘')">버블링 발생 버튼</button>
      <button @click.stop="log('2️⃣ 자식 버튼 클릭 — 나만 찍힘 (.stop)')">버블링 차단 버튼</button>
    </div>

    <h3>3) .once — 딱 한 번만 실행</h3>
    <p class="desc">설문 제출, 좋아요 버튼의 중복 클릭을 막을 때 쓴다.</p>
    <button @click.once="handleOnce">한 번만 먹히는 버튼 (계속 눌러보세요)</button>

    <h3>4) .self — 자기 자신을 직접 눌렀을 때만</h3>
    <p class="desc">
      회색 배경(부모)을 눌렀을 때만 반응하고, 안쪽 버튼을 눌렀을 땐 무시한다. 모달 팝업의 "바깥
      눌러서 닫기" 구현이 바로 이것이다.
    </p>
    <div class="self-box" @click.self="log('🎯 .self — 배경을 직접 눌렀을 때만 실행')">
      <p>이 회색 배경을 직접 눌러보세요</p>
      <button @click="log('안쪽 버튼 클릭 (배경 이벤트는 실행 안 됨)')">안쪽 버튼</button>
    </div>

    <h3>5) 키보드 수식어 — .enter</h3>
    <p class="desc">
      원래는 함수 안에서 <code>if (e.key === 'Enter')</code> 를 검사해야 하는데, .enter 한 단어로
      끝난다.
    </p>
    <input v-model="keyword" @keyup.enter="search" placeholder="검색어 입력 후 Enter" size="30" />
    <button @click="search">검색</button>

    <h3>실행 로그</h3>
    <button class="mini" @click="clearLogs">로그 지우기</button>
    <ul class="log-box">
      <li v-if="logs.length === 0" class="empty">(위 버튼들을 눌러보세요)</li>
      <li v-for="(item, index) in logs" :key="index">{{ item }}</li>
    </ul>
  </div>
</template>

<style scoped>
.practice-section {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}
.desc {
  color: #666;
  font-size: 0.9rem;
}
.parent-box {
  padding: 20px;
  background-color: #eee;
  border-radius: 6px;
}
.self-box {
  padding: 25px;
  background-color: #ddd;
  border-radius: 6px;
}
.log-box {
  list-style: none;
  padding: 10px;
  margin: 6px 0 0;
  background-color: #1e1e1e;
  color: #7ee787;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.85rem;
  min-height: 60px;
}
.log-box .empty {
  color: #888;
}
.mini {
  font-size: 0.8rem;
}
code {
  background-color: #eee;
  padding: 1px 5px;
  border-radius: 3px;
}
button {
  margin-right: 6px;
}
</style>
