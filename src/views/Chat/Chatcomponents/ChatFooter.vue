<script setup>
import { ref, nextTick, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import StickerPanel from './StickerPanel.vue'
import ImagePicker from './ImagePicker.vue'

const emit = defineEmits(['send', 'ai-reply', 'send-sticker', 'send-image'])

const inputText = ref('')
const inputRef = ref(null)
const showDrawer = ref(false)
const showStickerPanel = ref(false)

const hasInput = computed(() => inputText.value.trim().length > 0)

function toggleDrawer() {
  showDrawer.value = !showDrawer.value
  showStickerPanel.value = false
}

function toggleStickerPanel() {
  showStickerPanel.value = !showStickerPanel.value
  showDrawer.value = false
}

function handleInputFocus() {
  showDrawer.value = false
  showStickerPanel.value = false
}

function adjustHeight() {
  const el = inputRef.value
  if (!el) return
  el.style.height = '38px'
  el.style.height = `${el.scrollHeight}px`
}

function keepInputFocus(event) {
  // 防止点击按钮时 textarea 失焦，手机键盘就不会先收回
  event.preventDefault()
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text) {
    await nextTick()
    inputRef.value?.focus()
    return
  }

  emit('send', text)
  inputText.value = ''
  showDrawer.value = false
  showStickerPanel.value = false

  await nextTick()
  adjustHeight()

  // 发送后保持输入框焦点，避免手机键盘收起
  inputRef.value?.focus()

  // iOS 有时 nextTick 后仍会丢焦，再补一次
  setTimeout(() => {
    inputRef.value?.focus()
  }, 0)
}

function handleEnterSend(event) {
  if (event.isComposing) return
  sendMessage()
}

function aiSendMessage() {
  emit('ai-reply')
}

function handleSendSticker(sticker) {
  emit('send-sticker', sticker)
}

function handleSendImage(image) {
  emit('send-image', image)
  showDrawer.value = false
}

</script>

<template>
<div class="chat-footer">

  <div class="chat-input-area">
      <button class="icon-btn secondary-btn" @click="toggleDrawer">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>

      <textarea
        ref="inputRef"
        class="chat-input"
        v-model="inputText"
        placeholder="说点好听的..."
        rows="1"
        @input="adjustHeight"
        @keydown.enter.exact.prevent="handleEnterSend"
        @focus="handleInputFocus"
      ></textarea>

      <div class="right-btns">
        <button class="icon-btn secondary-btn" type="button" title="表情包" aria-label="表情包" @click="toggleStickerPanel">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <circle cx="12" cy="12" r="9"></circle>
            <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"></circle>
            <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"></circle>
            <path d="M8 14c1 1.5 2.3 2 4 2s3-.5 4-2"></path>
          </svg>
        </button>
        <!-- 有文字时显示发送键，否则显示 AI 回消息键 -->
        <button v-if="hasInput" class="icon-btn primary-btn" type="button" title="发送" aria-label="发送" @pointerdown="keepInputFocus" @click="sendMessage">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
        <button v-else class="icon-btn primary-btn" type="button" title="AI 回消息" aria-label="AI 回消息" @click="aiSendMessage">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>  
          
      </div>
    </div>

    <div class="chat-drawer" :class="{ show: showDrawer }">
      <div class="drawer-grid">
        <div class="drawer-item"><div class="drawer-icon">🧩</div><div class="drawer-label">模型</div></div>
<ImagePicker @send-image="handleSendImage" />
        <div class="drawer-item"><div class="drawer-icon">🎬</div><div class="drawer-label">视频</div></div>
        <div class="drawer-item"><div class="drawer-icon">📍</div><div class="drawer-label">位置</div></div>
        <div class="drawer-item"><div class="drawer-icon">🧧</div><div class="drawer-label">红包</div></div>
      </div>
    </div>

    <StickerPanel
    v-model:visible="showStickerPanel"
    @send-sticker="handleSendSticker"
    />


  </div>
</template>

<style scoped>
.chat-footer {
  position: relative;
  background: #fff;
}

.chat-input-area {
  background-color: #ffffff;
  border-top: 1px solid #ffe6f0;
  padding: 10px 12px;
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
.chat-input {
  flex: 1;
  min-height: 38px;
  max-height: 120px;
  border: none;
  border-radius: 19px;
  padding: 9px 16px;
  background-color: #f7f7f7;
  outline: none;
  color: #333;
  resize: none;
  overflow-y: auto;
  line-height: 20px;
  white-space: pre-wrap;
  word-break: break-word;
}
.right-btns {
  display: flex;
  gap: 8px;
}
.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
}
.secondary-btn {
  background-color: #fff0f5;
  color: #ffb7d2;
}
.primary-btn {
  background-color: #ffb7d2;
  color: #ffffff;
}
.chat-drawer {
  height: 0;
  overflow: hidden;
  transition: height 0.3s ease;
  background: #f7f7f7;
}
.chat-drawer.show {
  height: 200px;
  border-top: 1px solid #eee;
}
.drawer-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px 10px;
  padding: 20px;
}
.drawer-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}
.drawer-icon {
  width: 56px;
  height: 56px;
  background-color: #ffffff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.drawer-label {
  font-size: 12px;
  color: #666;
}

</style>
