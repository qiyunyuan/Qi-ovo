<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { getStickerById, getStickerImageUrl } from '../../../services/stickerDb'
import { isImageSrc } from '../../../services/avatar'

const emit = defineEmits(['media-loaded'])

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  userAvatar: {
    type: String,
    default: ''
  },
  charAvatar: {
    type: String,
    default: ''
  },
    showBubbleTime: {
    type: Boolean,
    default: true
  }
})

const isUserMessage = computed(() => props.message.role === 'user')
const messageSide = computed(() => isUserMessage.value ? 'right' : 'left')
// 用户消息 → 资料APP里的用户头像；AI 消息 → 角色头像
const avatar = computed(() => isUserMessage.value ? props.userAvatar : props.charAvatar)

const textContent = computed(() => {
  if (props.message.type !== 'text') return ''
  return props.message.payload?.text || ''
})

const bubbleTime = computed(() => {
  const timestamp = Number(props.message.createdAt)

  if (!Number.isFinite(timestamp)) return ''

  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(timestamp))
})

const stickerUrl = ref('')
const stickerAlt = ref('表情包')
let currentObjectUrl = ''

watch(
  () => props.message.payload?.stickerId,
  async stickerId => {
    if (props.message.type !== 'sticker' || !stickerId) return

    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl)
      currentObjectUrl = ''
    }

    const sticker = await getStickerById(stickerId)
    if (!sticker) return

    const url = getStickerImageUrl(sticker)

    if (sticker.source === 'local') {
      currentObjectUrl = url
    }

    stickerUrl.value = url
    stickerAlt.value = sticker.text || '表情包'
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl)
  }
})

</script>

<template>
  <div class="message-row" :class="messageSide">
    <div class="avatar" v-if="!isUserMessage">
      <img v-if="isImageSrc(avatar)" :src="avatar" class="avatar-img" alt="" />
      <div v-else class="avatar-placeholder"></div>
    </div>

<div class="message-content">
  <div class="bubble">
    <template v-if="message.type === 'text'">
      {{ textContent }}
    </template>

    <template v-else-if="message.type === 'image'">
      <img
        class="message-image"
        :src="message.payload.url"
        :alt="message.payload.alt || '图片'"
        @load="emit('media-loaded')"
      />
    </template>

    <template v-else-if="message.type === 'sticker'">
      <img
        v-if="stickerUrl"
        class="sticker-image"
        :src="stickerUrl"
        :alt="stickerAlt"
        @load="emit('media-loaded')"
      />
    </template>

    <template v-else>
      不支持的消息类型
    </template>
  </div>

  <div
    v-if="showBubbleTime && bubbleTime"
    class="bubble-time"
  >
    {{ bubbleTime }}
  </div>
</div>

    <div class="avatar" v-if="isUserMessage">
      <img v-if="isImageSrc(avatar)" :src="avatar" class="avatar-img" alt="" />
      <div v-else class="avatar-placeholder"></div>
    </div>
  </div>
</template>

<style scoped>
.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.message-row.right {
  justify-content: flex-end;
}
.message-row .avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  flex-shrink: 0;
  overflow: hidden;
}
.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.message-row .bubble {
  max-width: 100%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 15px;
  line-height: 1.4;
  box-shadow: 0 2px 4px rgba(255, 183, 210, 0.15);
  overflow: hidden;

  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  min-width: 0;
}
.message-row.left .bubble {
  background-color: #ffffff;
  color: #333;
  border-bottom-left-radius: 2px;
}
.message-row.right .bubble {
  background-color: #ffb7d2;
  color: #ffffff;
  border-bottom-right-radius: 2px;
}
.message-image {
  display: block;
  max-width: 180px;
  width: 100%;
  border-radius: 10px;
}

.message-row .bubble:has(.sticker-image) {
  padding: 0;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
  overflow: visible;
}

.sticker-image {
  display: block;
  width: 120px;
  height: 120px;
  object-fit: contain;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #f0f0f0; /* 浅灰占位，如果要透明就写 transparent */
}

.message-content {
  display: flex;
  max-width: 70%;
  min-width: 0;
  flex-direction: column;
}

.message-row.left .message-content {
  align-items: flex-start;
}

.message-row.right .message-content {
  align-items: flex-end;
}

/* 原 bubble 的 max-width 改由 message-content 控制 */
.message-row .bubble {
  max-width: 100%;
}

.bubble-time {
  margin-top: 4px;
  padding: 0 3px;
  color: #aaa;
  font-size: 11px;
  line-height: 1.2;
}

</style>
