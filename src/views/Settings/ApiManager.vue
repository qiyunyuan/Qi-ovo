<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PhoneFrame from '../../components/PhoneFrame.vue'
import { getAllApiConfigs, addApiConfig, updateApiConfig, deleteApiConfig } from '../../services/aiConfig.js'

const router = useRouter()

const configs = ref([])
const dialogVisible = ref(false)
const dialogMode = ref('create')
const editingId = ref(null)

const form = ref({
  name: '',
  baseURL: '',
  apiKey: ''
})

const dialogTitle = computed(() => {
  return dialogMode.value === 'create' ? '添加 API' : '编辑 API'
})

function syncStorage(nextConfigs) {
  configs.value = nextConfigs
  saveApiConfigs(nextConfigs)
}

function openCreateDialog() {
  dialogMode.value = 'create'
  editingId.value = null
  form.value = {
    name: '',
    baseURL: '',
    apiKey: ''
  }
  dialogVisible.value = true
}

function openEditDialog(item) {
  dialogMode.value = 'edit'
  editingId.value = item.id
  form.value = {
    name: item.name,
    baseURL: item.baseURL,
    apiKey: item.apiKey
  }
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
}

async function saveConfig() {
  const name = form.value.name.trim()
  const baseURL = form.value.baseURL.trim()
  const apiKey = form.value.apiKey.trim()

  if (!name || !baseURL || !apiKey) return

  if (dialogMode.value === 'create') {
    const newItem = await addApiConfig({ name, baseURL, apiKey })
    configs.value.push(newItem)
  } else {
    await updateApiConfig(editingId.value, { name, baseURL, apiKey })
    const idx = configs.value.findIndex(item => item.id === editingId.value)
    if (idx !== -1) {
      configs.value[idx] = { ...configs.value[idx], name, baseURL, apiKey }
    }
  }

  closeDialog()
}

async function deleteConfig(id) {
  await deleteApiConfig(id)
  configs.value = configs.value.filter(item => item.id !== id)
}

function goBack() {
  router.push('/settings')
}

onMounted(async () => {
  configs.value = await getAllApiConfigs()
})
</script>

<template>
  <PhoneFrame>
    <div class="api-page">
      
      <!-- 1. 标题栏 -->
      <div class="sys-app-header">
        <div class="sys-header-btn" @click="goBack">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </div>
        <div class="sys-header-title">API 设置</div>
        <div class="sys-header-btn" @click="openCreateDialog">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </div>
      </div>

      <!-- 2. 内容区域 -->
      <div class="sys-app-content">
        <!-- 小标题 -->
        <div class="section-title">已保存的 API</div>

        <!-- 3. 已保存的 API 列表 -->
        <div class="api-list" v-if="configs.length">
          <!-- 点击整个卡片进行编辑 -->
          <div v-for="item in configs" :key="item.id" class="api-card" @click="openEditDialog(item)">
            <div class="api-info-left">
              <div class="api-name">{{ item.name }}</div>
              <div class="api-url-box">
                <span class="api-url">{{ item.baseURL }}</span>
              </div>
            </div>
            <div class="api-action-right">
              <!-- .stop 阻止冒泡，避免点击删除时触发编辑 -->
              <button class="cute-btn-small-danger" type="button" @click.stop="deleteConfig(item.id)">
                删除
              </button>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-state">
          还没有 API 配置，点击右上角添加吧 ~
        </div>
      </div>

      <!-- ================== 添加/编辑 API 弹窗 ================== -->
      <Transition name="modal">
        <div v-if="dialogVisible" class="modal-overlay" @click.self="closeDialog">
          <div class="modal-content">
            <div class="modal-header">
              <h3>{{ dialogTitle }}</h3>
              <button class="close-btn" @click="closeDialog">×</button>
            </div>
            
            <div class="modal-body">
              <div class="edit-form-group">
                <label>API 名称</label>
                <input v-model="form.name" type="text" class="cute-input" placeholder="例如：OpenAI / 自定义">
              </div>
              <div class="edit-form-group">
                <label>接口地址 (URL)</label>
                <input v-model="form.baseURL" type="text" class="cute-input" placeholder="例如: https://api.openai.com">
              </div>
              <div class="edit-form-group">
                <label>密钥 (API Key)</label>
                <input v-model="form.apiKey" type="password" class="cute-input" placeholder="sk-xxxxxxxxxxxxxxxx">
              </div>
            </div>
            
            <div class="modal-footer">
              <button class="cute-btn-small" 
                      style="width: 100%; padding: 12px; font-size: 1rem;" 
                      :disabled="!form.name || !form.baseURL || !form.apiKey" 
                      @click="saveConfig">
                保存 API
              </button>
            </div>
          </div>
        </div>
      </Transition>

    </div>
  </PhoneFrame>
</template>

<style scoped>
/* ================== 基础布局 (补充的系统UI样式) ================== */
.api-page {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fffcfd; /* 匹配可爱的浅色背景 */
  overflow: hidden;
}

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

.sys-app-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

/* ================== 小标题 ================== */
.section-title {
  color: #ff8da1;
  font-size: 0.9rem;
  font-weight: bold;
  margin: 10px 0 16px 6px;
  letter-spacing: 0.5px;
}

/* ================== 空状态 ================== */
.empty-state {
  margin-top: 40px;
  text-align: center;
  color: #ffb3c6;
  font-size: 0.9rem;
  font-weight: bold;
  padding: 24px;
  border: 2px dashed #ffe5e5;
  border-radius: 20px;
}

/* ================== API 卡片列表 ================== */
.api-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.api-card {
  background-color: white;
  border-radius: 20px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(255, 183, 210, 0.15);
  transition: box-shadow 0.2s, transform 0.2s;
  cursor: pointer;
}

.api-card:active {
  transform: scale(0.98);
  background-color: #fff0f3;
}

/* 卡片左侧：名字与地址 */
.api-info-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  padding-right: 10px;
}

.api-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: #444;
  margin-bottom: 12px;
}

.api-url-box {
  background-color: #f7f9fa;
  padding: 6px 12px;
  border-radius: 10px;
  display: inline-block;
  max-width: fit-content;
}

.api-url {
  font-size: 0.75rem;
  color: #a0a0a0;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

/* 卡片右侧：操作 */
.api-action-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
}

.cute-btn-small-danger {
  padding: 8px 12px;
  border: none;
  border-radius: 10px;
  background-color: #ffebee;
  color: #e53935;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cute-btn-small-danger:active {
  background-color: #ffcdd2;
}

/* ================== 弹窗 (Modal) ================== */
.modal-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  width: 85%;
  max-width: 320px;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(255, 141, 161, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
  color: #ff8da1;
  font-size: 1.15rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  color: #ccc;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.modal-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

/* ================== Vue 弹窗动画过渡 ================== */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-active .modal-content {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-enter-from .modal-content, .modal-leave-to .modal-content {
  transform: translateY(20px) scale(0.95);
}
.modal-enter-to .modal-content, .modal-leave-from .modal-content {
  transform: translateY(0) scale(1);
}

/* ================== 表单输入框 ================== */
.edit-form-group {
  margin-bottom: 18px;
}

.edit-form-group label {
  display: block;
  font-size: 0.85rem;
  color: #ff8da1;
  margin-bottom: 8px;
  font-weight: bold;
  padding-left: 6px;
}

.cute-input {
  width: 100%;
  box-sizing: border-box;
  background-color: white;
  border: 2px solid #ffe5e5;
  border-radius: 16px;
  padding: 14px 16px;
  font-size: 1rem;
  color: #444;
  outline: none;
  transition: all 0.2s ease;
}

.cute-input:focus {
  border-color: #ffb3c6;
  box-shadow: 0 0 0 4px rgba(255, 179, 198, 0.2);
}

.cute-btn-small {
  border: none;
  background: linear-gradient(135deg, #ffb3c6 0%, #ff8da1 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  box-shadow: 0 4px 10px rgba(255, 141, 161, 0.3);
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
}

.cute-btn-small:active:not(:disabled) {
  transform: scale(0.92);
}

.cute-btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
