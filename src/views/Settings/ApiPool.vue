<!-- src/views/Settings/ApiPool.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import PhoneFrame from '../../components/PhoneFrame.vue'
import FunctionCard from './ApiPoolComponents/FunctionCard.vue'
import AddApiModal  from './ApiPoolComponents/AddApiModal.vue'
import { getPoolConfig, addChatApi, removeChatApi, getApiStatus, resetPoolHealth } from '../../services/apiPool.js'
import { getAllApiConfigs } from '../../services/aiConfig.js'

const router = useRouter()

// ── 数据 ───────────────────────────────────────
const chatApis    = ref([])   // [{ apiConfigId, apiName, model }]
const apiOptions  = ref([])   // 从 ApiManager 拿到的全部 API
const statusMap   = ref(new Map())  // 存储每个 API 的状态
const refreshTimer = ref(null)  // 自动刷新定时器

// ── 弹窗控制 ───────────────────────────────────
const modalVisible  = ref(false)
const activeFunction= ref('')

// ── 初始化 ─────────────────────────────────────
onMounted(async () => {
  const [poolCfg, apis] = await Promise.all([
    getPoolConfig(),
    getAllApiConfigs()
  ])
  chatApis.value   = poolCfg.chatApis ?? []
  apiOptions.value = apis
  
  // 初始化状态
  await refreshStatus()
  
  // 设置自动刷新（每2秒刷新一次）
  refreshTimer.value = setInterval(refreshStatus, 2000)
})

// ── 清理 ───────────────────────────────────────
onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})

// ── 刷新状态 ───────────────────────────────────
async function refreshStatus() {
  const newStatusMap = new Map()
  for (const api of chatApis.value) {
    const status = getApiStatus(api.apiConfigId)
    newStatusMap.set(api.apiConfigId, status)
  }
  statusMap.value = newStatusMap
}

// ── 打开弹窗 ───────────────────────────────────
function openAddModal(funcKey) {
  activeFunction.value = funcKey
  modalVisible.value   = true
}

// ── 确认添加 ───────────────────────────────────
async function handleConfirm(entry) {
  await addChatApi(entry)
  chatApis.value.push(entry)
  modalVisible.value = false
  await refreshStatus()
}

// ── 删除条目 ───────────────────────────────────
async function handleRemoveChat(idx) {
  await removeChatApi(idx)
  chatApis.value.splice(idx, 1)
  await refreshStatus()
}

// ── 重置所有状态 ───────────────────────────────
async function handleResetStatus() {
  resetPoolHealth()
  await refreshStatus()
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
        <!-- 重置按钮 -->
        <div class="sys-header-btn" @click="handleResetStatus" title="重置所有状态">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor"
               stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
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
          :statusMap="statusMap"
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
