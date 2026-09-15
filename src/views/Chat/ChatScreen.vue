<script setup>
import { ref, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import PhoneFrame from '../../components/PhoneFrame.vue'
import ChatHeader from './Chatcomponents/ChatHeader.vue'
import ChatMessage from './Chatcomponents/ChatMessage.vue'
import ChatFooter from './Chatcomponents/ChatFooter.vue'
import MessageActionModal from './Chatcomponents/MessageActionModal.vue'
import { useCharStore } from '../../stores/char'
import { useProfileStore } from '../../stores/profile'
import { resolveAvatarValue } from '../../services/avatar'
import { getChatSettings } from '../../services/Chat/chatSettingsDb.js'
import { generateAiReply } from '../../services/aiChat'
import { getChatMessages, saveChatMessage, deleteChatMessage } from '../../services/Chat/chatMessageDb.js'

const route = useRoute()

const charStore = useCharStore()
const profileStore = useProfileStore()

const title = computed(() => route.query.name || charStore.info?.name || 'chat')

const chatContentRef = ref(null)

const showBubbleTime = ref(true)
const showChatTimeDivider = ref(true)

const TIME_DIVIDER_INTERVAL = 5 * 60 * 1000

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

  if (userAvatar.value && userAvatar.value.startsWith('blob:')) {
    userObjectUrl = userAvatar.value
  }

  if (charAvatar.value && charAvatar.value.startsWith('blob:')) {
    charObjectUrl = charAvatar.value
  }

  await loadChatHistory()
}

onMounted(loadProfiles)

onUnmounted(() => {
  if (userObjectUrl) URL.revokeObjectURL(userObjectUrl)
  if (charObjectUrl) URL.revokeObjectURL(charObjectUrl)
})

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

  const isDifferentDay =
    currentDate.getFullYear() !== previousDate.getFullYear() ||
    currentDate.getMonth() !== previousDate.getMonth() ||
    currentDate.getDate() !== previousDate.getDate()

  if (isDifferentDay) return true

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
    return `${timeText}`
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
    const replyTexts = await generateAiReply(messages.value, {
      maxRounds: 10
    })
    
    const typingIndex = messages.value.findIndex(msg => msg.id === typingMessage.id)
    if (typingIndex !== -1) {
      messages.value.splice(typingIndex, 1)
    }
    
    for (const text of replyTexts) {
      const message = createMessage({
        role: 'assistant',
        type: 'text',
        payload: { text },
        status: 'sent'
      })
      
      messages.value.push(message)
      await saveMessage(message)
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
  } catch (error) {
    console.error('AI 回复失败:', error)
    
    const targetMessage = messages.value.find(message => message.id === typingMessage.id)
    if (!targetMessage) return
    
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

// 消息操作弹窗相关
const showActionModal = ref(false)
const selectedMessage = ref(null)

function handleLongPress(message) {
  selectedMessage.value = message
  showActionModal.value = true
}

function closeActionModal() {
  showActionModal.value = false
  selectedMessage.value = null
}

async function handleDeleteMessage(message) {
  if (!message || !message.id) return
  
  try {
    // 从 IndexedDB 删除
    await deleteChatMessage(message.id)
    
    // 从界面列表中删除
    const index = messages.value.findIndex(msg => msg.id === message.id)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
    
    console.log('消息已删除:', message.id)
  } catch (error) {
    console.error('删除消息失败:', error)
  }
}
</script>

<template>
  <PhoneFrame>
    <div class="chat-room-overlay">
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
            @long-press="handleLongPress"
          />
        </template>
      </div>

      <ChatFooter
        @send="handleSend"
        @ai-reply="handleAiReply"
        @send-sticker="handleSendSticker"
        @send-image="handleSendImage"
      />

      <!-- 消息操作弹窗 -->
      <MessageActionModal
        :show="showActionModal"
        :message="selectedMessage"
        @close="closeActionModal"
        @delete="handleDeleteMessage"
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
