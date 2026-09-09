<!-- src/views/Settings/ApiPool.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PhoneFrame from '../../components/PhoneFrame.vue'
import FunctionCard from './ApiPoolComponents/FunctionCard.vue'
import AddApiModal  from './ApiPoolComponents/AddApiModal.vue'
import { getPoolConfig, addChatApi, removeChatApi } from '../../services/apiPool.js'
import { getAllApiConfigs } from '../../services/aiConfig.js'

const router = useRouter()

// ── 数据 ───────────────────────────────────────
const chatApis    = ref([])   // [{ apiConfigId, apiName, model }]
const apiOptions  = ref([])   // 从 ApiManager 拿到的全部 API

// ── 弹窗控制 ───────────────────────────────────
const modalVisible  = ref(false)
// 未来有更多功能卡片时，用这个字段区分是哪个功能在新增
const activeFunction= ref('')

// ── 初始化 ─────────────────────────────────────
onMounted(async () => {
  const [poolCfg, apis] = await Promise.all([
    getPoolConfig(),
    getAllApiConfigs()
  ])
  chatApis.value   = poolCfg.chatApis ?? []
  apiOptions.value = apis
})

// ── 打开弹窗 ───────────────────────────────────
function openAddModal(funcKey) {
  activeFunction.value = funcKey
  modalVisible.value   = true
}

// ── 确认添加 ───────────────────────────────────
async function handleConfirm(entry) {
  // 目前只有 chat，以后 switch(activeFunction.value) 扩展
  await addChatApi(entry)
  chatApis.value.push(entry)
  modalVisible.value = false
}

// ── 删除条目 ───────────────────────────────────
async function handleRemoveChat(idx) {
  await removeChatApi(idx)
  chatApis.value.splice(idx, 1)
}

function goBack() {
  router.push('/settings')
}
</script>

<template>
  <PhoneFrame>
    <div class="pool-page">

      <!-- ── 标题栏 ────────────────────────── -->
      <div class="sys-app-header">
        <div class="sys-header-btn" @click="goBack">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor"
               stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </div>
        <div class="sys-header-title">API 轮询池</div>
        <!-- 占位，保持标题居中 -->
        <div class="sys-header-btn" style="opacity:0; pointer-events:none;">
          <svg viewBox="0 0 24 24" width="22" height="22"/>
        </div>
      </div>

      <!-- ── 内容区 ──────────────────────── -->
      <div class="pool-content">
        <div class="section-title">功能配置</div>

        <!-- 聊天功能配置卡片 -->
        <FunctionCard
          title="聊天"
          icon="💬"
          :entries="chatApis"
          @add="openAddModal('chat')"
          @remove="handleRemoveChat"
        />

        <!-- 未来在此继续 <FunctionCard title="图像生成" icon="🎨" …> -->
      </div>

      <!-- ── 新增 API 弹窗 ───────────────── -->
      <AddApiModal
        :visible="modalVisible"
        :apiOptions="apiOptions"
        @close="modalVisible = false"
        @confirm="handleConfirm"
      />

    </div>
  </PhoneFrame>
</template>

<style scoped>
.pool-page {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fffcfd;
  overflow: hidden;
}

/* ── 标题栏（复用 ApiManager 相同样式）─── */
.sys-app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: white;
  border-bottom: 1px solid #fff0f3;
  z-index: 10;
}

.sys-header-title {
  font-weight: bold;
  font-size: 1.1rem;
  color: #444;
}

.sys-header-btn {
  color: #ff8da1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
  padding: 4px;
}

.sys-header-btn:active {
  transform: scale(0.9);
}

/* ── 内容区 ────────────────────────────── */
.pool-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  color: #ff8da1;
  font-size: 0.9rem;
  font-weight: bold;
  margin: 4px 0 4px 6px;
  letter-spacing: 0.5px;
}
</style>
