<!-- src/views/Debug/PromptDebug.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PhoneFrame from '../../components/PhoneFrame.vue'
import { previewPrompt } from '../../services/aiChat'
import { debugPrompt } from '../../services/Prompt/PromptBuilder'
import { getChatMessages } from '../../services/chatMessageDb'
import { useProfileStore } from '../../stores/profile'

const router = useRouter()
const profileStore = useProfileStore()

const messages = ref([])
const previewText = ref('')
const loading = ref(false)
const messageCount = ref(0)
const viewMode = ref('readable') // 'readable' | 'json'

// 加载实际的聊天消息
async function loadMessages() {
  try {
    loading.value = true
    
    // 确保 profile 已加载，获取当前用户 uid
    if (!profileStore.loaded) {
      await profileStore.load()
    }
    
    const uid = profileStore.info?.uid
    if (!uid) {
      previewText.value = '错误: 未找到当前用户 uid'
      return
    }
    
    // 从数据库读取消息
    const dbMessages = await getChatMessages(uid)
    messages.value = dbMessages
    messageCount.value = dbMessages.length
    
    if (dbMessages.length === 0) {
      previewText.value = '暂无聊天消息，请先在聊天界面发送一些消息'
    } else {
      previewText.value = `已加载 ${dbMessages.length} 条消息，点击"生成预览"查看发送给 AI 的提示词`
    }
  } catch (error) {
    previewText.value = `加载消息失败: ${error.message}`
  } finally {
    loading.value = false
  }
}

async function handlePreview() {
  if (messages.value.length === 0) {
    previewText.value = '没有可预览的消息，请先加载或发送消息'
    return
  }
  
  try {
    loading.value = true
    const preview = await previewPrompt(messages.value, { maxRounds: 10 })
    
    // 根据当前视图模式显示不同格式
    if (viewMode.value === 'json') {
      // JSON 格式：这是真正发给 API 的数据
      previewText.value = JSON.stringify(preview, null, 2)
    } else {
      // 可读格式：使用 debugPrompt 函数格式化
      previewText.value = debugPrompt(preview)
    }
  } catch (error) {
    previewText.value = `错误: ${error.message}`
  } finally {
    loading.value = false
  }
}

// 切换视图模式
function toggleViewMode() {
  viewMode.value = viewMode.value === 'json' ? 'readable' : 'json'
  // 如果已经生成过预览，自动重新渲染
  if (previewText.value && !previewText.value.includes('加载') && !previewText.value.includes('错误')) {
    handlePreview()
  }
}

// 返回主屏幕
function goHome() {
  router.push('/')
}

// 组件挂载时自动加载消息
onMounted(() => {
  loadMessages()
})
</script>

<template>
  <PhoneFrame>
    <div class="debug-container">
      <!-- 顶部导航栏 -->
      <div class="header">
        <h1 class="title">提示词调试</h1>
        <button class="close-btn" @click="goHome">✖</button>
      </div>

      <!-- 内容区 -->
      <div class="content">
        <div class="info-bar">
          <span class="message-count">消息数: {{ messageCount }}</span>
          <button class="refresh-btn" @click="loadMessages" :disabled="loading">
            {{ loading ? '加载中...' : '刷新消息' }}
          </button>
        </div>
        
        <div class="control-bar">
          <button class="preview-btn" @click="handlePreview" :disabled="loading || messages.length === 0">
            {{ loading ? '生成中...' : '生成预览' }}
          </button>
          
          <button class="mode-btn" @click="toggleViewMode" :disabled="loading">
            {{ viewMode === 'json' ? '📋 JSON' : '📖 可读' }}
          </button>
        </div>
        
        <!-- 模式说明 -->
        <div class="mode-hint">
          <span v-if="viewMode === 'json'">
            💡 JSON 模式：显示发送给 API 的原始数据结构
          </span>
          <span v-else>
            💡 可读模式：分板块显示，方便阅读和调试
          </span>
        </div>
        
        <!-- 呈现提示词 -->
        <pre class="preview-content">{{ previewText }}</pre>
      </div>
    </div>
  </PhoneFrame>
</template>

<style scoped>
.debug-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.title {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}

.message-count {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.refresh-btn {
  padding: 6px 12px;
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.refresh-btn:hover:not(:disabled) {
  background: #d0d0d0;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.control-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.preview-btn {
  flex: 1;
  padding: 10px 20px;
  background: #ffb7d2;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
}

.preview-btn:hover:not(:disabled) {
  background: #ff9cb9;
}

.preview-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mode-btn {
  padding: 10px 20px;
  background: #6c63ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  min-width: 90px;
}

.mode-btn:hover:not(:disabled) {
  background: #5850e6;
}

.mode-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mode-hint {
  margin-bottom: 15px;
  padding: 8px 12px;
  background: #e8f4ff;
  border-left: 3px solid #6c63ff;
  border-radius: 4px;
  font-size: 13px;
  color: #555;
}

.preview-content {
  background: #f5f5f5;
  padding: 15px;
  overflow-x: auto;
  white-space: pre-wrap; 
  word-break: break-all;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  border-radius: 8px;
  color: #333;
  min-height: 200px;
  line-height: 1.6;
}
</style>
