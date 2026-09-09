<!-- src/views/Settings/ApiPoolComponents/AddApiModal.vue -->
<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible:    { type: Boolean, required: true },
  apiOptions: { type: Array,   default: () => [] }  // [{ id, name, baseURL, apiKey }]
})

const emit = defineEmits(['close', 'confirm'])

// ── 内部状态 ──────────────────────────────────
const step        = ref('pick')       // 'pick' | 'model'
const selectedApi = ref(null)         // 选中的 apiOption 对象
const models      = ref([])
const loadingModel= ref(false)
const modelError  = ref('')
const chosenModel = ref('')

// 弹窗打开时重置
watch(() => props.visible, (v) => {
  if (v) {
    step.value        = 'pick'
    selectedApi.value = null
    models.value      = []
    loadingModel.value= false
    modelError.value  = ''
    chosenModel.value = ''
  }
})

// ── 选择 API 后拉取模型 ──────────────────────────
async function pickApi(api) {
  selectedApi.value  = api
  step.value         = 'model'
  models.value       = []
  loadingModel.value = true
  modelError.value   = ''
  chosenModel.value  = ''

  try {
    const base = api.baseURL.replace(/\/$/, '')
    const res  = await fetch(`${base}/v1/models`, {
      headers: { Authorization: `Bearer ${api.apiKey}` }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    // 兼容 openai 标准格式 { data: [...] }
    models.value = (json.data ?? json.models ?? json).map(m =>
      typeof m === 'string' ? m : (m.id ?? m.name ?? String(m))
    )
    if (models.value.length) chosenModel.value = models.value[0]
  } catch (e) {
    modelError.value = `拉取失败：${e.message}`
  } finally {
    loadingModel.value = false
  }
}

function backToPick() {
  step.value = 'pick'
}

function confirm() {
  if (!chosenModel.value) return
  emit('confirm', {
    apiConfigId: selectedApi.value.id,
    apiName:     selectedApi.value.name,
    model:       chosenModel.value
  })
}
</script>

<template>
  <Transition name="modal">
    <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">

        <!-- ── 标题栏 ─────────────────────────── -->
        <div class="modal-header">
          <button v-if="step === 'model'" class="back-btn" @click="backToPick">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor"
                 stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h3>{{ step === 'pick' ? '选择 API' : '选择模型' }}</h3>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>

        <!-- ── Step 1：选择 API ────────────────── -->
        <div v-if="step === 'pick'" class="modal-body">
          <p class="step-hint">从 API 管理中选择一个 API</p>

          <div v-if="apiOptions.length === 0" class="empty-hint">
            暂无可用 API，请先前往 API 管理添加 ~
          </div>

          <div v-else class="api-option-list">
            <div
              v-for="api in apiOptions"
              :key="api.id"
              class="api-option-row"
              @click="pickApi(api)"
            >
              <div class="option-name">{{ api.name }}</div>
              <div class="option-url">{{ api.baseURL }}</div>
            </div>
          </div>
        </div>

        <!-- ── Step 2：选择模型 ───────────────── -->
        <div v-else class="modal-body">
          <p class="step-hint">API：<strong>{{ selectedApi.name }}</strong></p>

          <!-- 加载中 -->
          <div v-if="loadingModel" class="loading-hint">
            正在拉取模型列表…
          </div>

          <!-- 拉取失败 -->
          <div v-else-if="modelError" class="error-hint">
            {{ modelError }}
            <br>
            <button class="cute-btn-small retry-btn" @click="pickApi(selectedApi)">重试</button>
          </div>

          <!-- 模型列表 -->
          <div v-else class="model-list">
            <div
              v-for="m in models"
              :key="m"
              class="model-row"
              :class="{ selected: chosenModel === m }"
              @click="chosenModel = m"
            >
              <span class="model-name">{{ m }}</span>
              <span v-if="chosenModel === m" class="model-check">✓</span>
            </div>
          </div>

          <!-- 确认按钮 -->
          <button
            class="cute-btn-small confirm-btn"
            :disabled="!chosenModel || loadingModel"
            @click="confirm"
          >
            确认添加
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── 遮罩 & 弹窗容器 ─────────────────────── */
.modal-overlay {
  position: absolute;
  inset: 0;
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
  display: flex;
  flex-direction: column;
  max-height: 80vh;          /* 防止模型列表过长时撑出屏幕 */
}

/* ── 标题栏 ──────────────────────────────── */
.modal-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 4px;
}

.modal-header h3 {
  flex: 1;
  margin: 0;
  color: #ff8da1;
  font-size: 1.1rem;
  text-align: center;
}

.back-btn {
  background: none;
  border: none;
  color: #ff8da1;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
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

/* ── body ────────────────────────────────── */
.modal-body {
  display: flex;
  flex-direction: column;
  overflow: hidden;         /* 让内部列表自己滚动 */
}

.step-hint {
  font-size: 0.82rem;
  color: #b0b0b0;
  margin: 0 0 12px 4px;
}

/* ── API 选项列表 ─────────────────────────── */
.empty-hint {
  text-align: center;
  color: #ffb3c6;
  font-size: 0.85rem;
  padding: 20px 0;
}

.api-option-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  max-height: 280px;
}

.api-option-row {
  background: #fffcfd;
  border: 2px solid #ffe5e5;
  border-radius: 16px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.api-option-row:active {
  background: #fff0f3;
  border-color: #ffb3c6;
}

.option-name {
  font-weight: bold;
  color: #444;
  font-size: 0.95rem;
}

.option-url {
  font-size: 0.72rem;
  color: #b0b0b0;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 加载 / 错误 ──────────────────────────── */
.loading-hint {
  text-align: center;
  color: #ffb3c6;
  font-size: 0.85rem;
  padding: 24px 0;
}

.error-hint {
  text-align: center;
  color: #e53935;
  font-size: 0.82rem;
  padding: 16px 0;
  line-height: 1.8;
}

.retry-btn {
  margin-top: 8px;
}

/* ── 模型列表 ─────────────────────────────── */
.model-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 240px;
  margin-bottom: 16px;
}

.model-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fffcfd;
  border: 2px solid #ffe5e5;
  border-radius: 14px;
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.model-row.selected {
  border-color: #ff8da1;
  background: #fff0f3;
}

.model-name {
  font-size: 0.88rem;
  color: #444;
  word-break: break-all;
}

.model-check {
  color: #ff8da1;
  font-weight: bold;
  flex-shrink: 0;
  margin-left: 8px;
}

/* ── 确认按钮 ─────────────────────────────── */
.confirm-btn {
  width: 100%;
  padding: 12px;
  font-size: 1rem;
  margin-top: 4px;
}

/* ── 通用按钮 ─────────────────────────────── */
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

/* ── 动画 ─────────────────────────────────── */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-active .modal-content {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: translateY(20px) scale(0.95);
}
</style>
