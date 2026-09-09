<script setup>
import { ref, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import PhoneFrame from '../../components/PhoneFrame.vue'
import ChatHeader from './Chatcomponents/ChatHeader.vue'
import ChatMessage from './Chatcomponents/ChatMessage.vue'
import ChatFooter from './Chatcomponents/ChatFooter.vue'
import { useCharStore } from '../../stores/char'
import { useProfileStore } from '../../stores/profile'
import { resolveAvatarValue } from '../../services/avatar'
import { getChatSettings } from '../../services/chatSettingsDb'
import { generateAiReply } from '../../services/aiChat'
import { getChatMessages, saveChatMessage } from '../../services/chatMessageDb'

const route = useRoute()

const charStore = useCharStore()
const profileStore = useProfileStore()

// 标题优先用 URL 参数，没有就用角色资料里的名字
const title = computed(() => route.query.name || charStore.info?.name || 'chat')

const chatContentRef = ref(null)

const showBubbleTime = ref(true)
const showChatTimeDivider = ref(true)

// 微信式时间条的间隔：5 分钟
const TIME_DIVIDER_INTERVAL = 5 * 60 * 1000

// ── 头像解析：与 InfoApp.vue 同一套规则（Blob/URL/路径/data:）──
let userObjectUrl = null
let charObjectUrl = null
const userAvatar = ref('')
const charAvatar = ref('')

function resolveAvatar(av) {
  return resolveAvatarValue(av).src
}

async function loadProfiles() {
  await Promise.all([profileStore.load(), charStore.load()])

  userAvatar.value = resolveAvatar(profileStore.info?.avatar)
  charAvatar.value = resolveAvatar(charStore.info?.avatar)

  // 读取聊天外观设置；旧用户没有此配置时使用默认值 true
  const uid = profileStore.info?.uid

  if (uid) {
    const settings = await getChatSettings(uid)

    if (typeof settings?.showBubbleTime === 'boolean') {
      showBubbleTime.value = settings.showBubbleTime
    }

    if (typeof settings?.showChatTimeDivider === 'boolean') {
      showChatTimeDivider.value = settings.showChatTimeDivider
    }
  }

  // 记录 blob: URL，组件卸载时释放
  if (userAvatar.value && userAvatar.value.startsWith('blob:')) {
    userObjectUrl = userAvatar.value
  }

  if (charAvatar.value && charAvatar.value.startsWith('blob:')) {
    charObjectUrl = charAvatar.value
  }

  // 加载历史消息
  await loadChatHistory()
}

onMounted(loadProfiles)

onUnmounted(() => {
  if (userObjectUrl) URL.revokeObjectURL(userObjectUrl)
  if (charObjectUrl) URL.revokeObjectURL(charObjectUrl)
})

// ── 消息持久化逻辑 ──
const messages = ref([])

async function loadChatHistory() {
  const uid = profileStore.info?.uid

  if (!uid) {
    console.warn('用户信息缺失，无法加载历史消息')
    return
  }

  try {
    const history = await getChatMessages(uid)
    messages.value = history
    await scrollToBottom()
  } catch (error) {
    console.error('加载历史消息失败:', error)
  }
}

async function saveMessage(message) {
  const uid = profileStore.info?.uid

  if (!uid) {
    console.warn('用户信息缺失，无法保存消息')
    return
  }

  try {
    await saveChatMessage(uid, message)
  } catch (error) {
    console.error('保存消息失败:', error)
  }
}

// ── 以下为原有逻辑 ──
function createMessage({ role, type = 'text', payload = {}, status = 'sent' }) {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    role,
    type,
    payload,
    createdAt: Date.now(),
    status
  }
}

function shouldShowTimeDivider(message, index) {
  // 第一条消息永远显示时间
  if (index === 0) return true

  const previousMessage = messages.value[index - 1]
  if (!previousMessage) return true

  const currentTime = Number(message.createdAt)
  const previousTime = Number(previousMessage.createdAt)

  if (!Number.isFinite(currentTime) || !Number.isFinite(previousTime)) {
    return false
  }

  const currentDate = new Date(currentTime)
  const previousDate = new Date(previousTime)

  // 跨天时一定显示
  const isDifferentDay =
    currentDate.getFullYear() !== previousDate.getFullYear() ||
    currentDate.getMonth() !== previousDate.getMonth() ||
    currentDate.getDate() !== previousDate.getDate()

  if (isDifferentDay) return true

  // 同一天内，间隔 5 分钟及以上显示
  return currentTime - previousTime >= TIME_DIVIDER_INTERVAL
}

function formatChatTimeDivider(timestamp) {
  const time = Number(timestamp)

  if (!Number.isFinite(time)) return ''

  const date = new Date(time)
  const now = new Date()

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)

  const timeText = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)

  if (isSameDay(date, now)) {
    return `今天 ${timeText}`
  }

  if (isSameDay(date, yesterday)) {
    return `昨天 ${timeText}`
  }

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${timeText}`
}

const isAiReplying = ref(false)

async function scrollToBottom() {
  await nextTick()
  if (chatContentRef.value) {
    chatContentRef.value.scrollTop = chatContentRef.value.scrollHeight
  }
}

async function handleSend(text) {
  const message = createMessage({
    role: 'user',
    type: 'text',
    payload: { text }
  })
  
  messages.value.push(message)
  await saveMessage(message)
  scrollToBottom()
}

async function handleSendSticker(sticker) {
  const message = createMessage({
    role: 'user',
    type: 'sticker',
    payload: { stickerId: sticker.id }
  })
  
  messages.value.push(message)
  await saveMessage(message)
  scrollToBottom()
}

async function handleAiReply() {
  if (isAiReplying.value) return

  isAiReplying.value = true

  const typingMessage = createMessage({
    role: 'assistant',
    type: 'text',
    payload: { text: '正在输入中...' },
    status: 'typing'
  })

  messages.value.push(typingMessage)
  await scrollToBottom()

  try {
    // 调用 aiChat.js 生成回复（现在返回数组）
    const replyTexts = await generateAiReply(messages.value, {
      maxRounds: 10
    })
    
    // 移除 typing 提示
    const typingIndex = messages.value.findIndex(msg => msg.id === typingMessage.id)
    if (typingIndex !== -1) {
      messages.value.splice(typingIndex, 1)
    }
    
    // 逐条添加回复消息，每条有独立的时间戳和 ID
    for (const text of replyTexts) {
      const message = createMessage({
        role: 'assistant',
        type: 'text',
        payload: { text },
        status: 'sent'
      })
      
      messages.value.push(message)
      await saveMessage(message)
      
      // 每条消息间隔一小段时间，让时间戳有差异（可选）
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
  } catch (error) {
    console.error('AI 回复失败:', error)
    
    const targetMessage = messages.value.find(message => message.id === typingMessage.id)
    if (!targetMessage) return
    
    // 显示更具体的错误信息
    let errorMessage = '生成失败，请稍后再试'
    
    if (error.message.includes('API 池为空')) {
      errorMessage = '未配置 API，请前往设置添加'
    } else if (error.message.includes('未找到启用的预设')) {
      errorMessage = '未启用预设，请前往提示词设置'
    } else if (error.message.includes('所有 API')) {
      errorMessage = '所有 API 暂时不可用，请检查配置'
    }
    
    targetMessage.payload.text = errorMessage
    targetMessage.status = 'error'
  } finally {
    isAiReplying.value = false
    scrollToBottom()
  }
}

async function handleSendImage(image) {
  const message = createMessage({
    role: 'user',
    type: 'image',
    payload: {
      url: image.url,
      alt: image.name,
      name: image.name,
      size: image.size
    }
  })
  
  messages.value.push(message)
  await saveMessage(message)
  scrollToBottom()
}
</script>

<template>
  <PhoneFrame>
    <div class="chat-room-overlay">
      <!-- 顶部导航栏：显示角色头像 + 名字 -->
      <ChatHeader :title="title" :avatar="charAvatar" />

      <div class="chat-room-content" ref="chatContentRef">
        <template v-for="(msg, index) in messages" :key="msg.id">
          <div
            v-if="showChatTimeDivider && shouldShowTimeDivider(msg, index)"
            class="chat-time-divider"
          >
            {{ formatChatTimeDivider(msg.createdAt) }}
          </div>

          <ChatMessage
            :message="msg"
            :user-avatar="userAvatar"
            :char-avatar="charAvatar"
            :show-bubble-time="showBubbleTime"
            @media-loaded="scrollToBottom"
          />
        </template>
      </div>

      <ChatFooter
        @send="handleSend"
        @ai-reply="handleAiReply"
        @send-sticker="handleSendSticker"
        @send-image="handleSendImage"
      />
    </div>
  </PhoneFrame>
</template>

<style scoped>
.chat-room-overlay {
  width: 100%;
  height: 100%;
  background-color: #fff0f5;
  display: flex;
  flex-direction: column;
}

.chat-room-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-time-divider {
  align-self: center;
  margin: 2px 0;
  padding: 5px 10px;
  border-radius: 12px;
  background: rgba(160, 130, 140, 0.16);
  color: #9d838b;
  font-size: 11px;
  line-height: 1.2;
}
</style>
