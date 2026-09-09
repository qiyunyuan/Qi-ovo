<script setup>
import { ref, watch, onMounted } from 'vue'
import { getChatSettings, saveChatSettings } from '@/services/chatSettingsDb'

const props = defineProps({
  uid: {
    type: String,
    required: true
  }
})

const isExpanded = ref(false)

// 上下文回合数，默认 5 回合
const contextRounds = ref(5)

// 初始化时从 IndexedDB 读取
onMounted(async () => {
  const saved = await getChatSettings(props.uid)

  if (saved?.contextRounds != null) {
    contextRounds.value = saved.contextRounds
  }
})

// 过滤非数字字符，只允许输入 0-9
function onInput(event) {
  const value = event.target.value.replace(/\D/g, '')
  contextRounds.value = value
}

// 失去焦点时进行兜底处理
function onBlur() {
  const parsed = parseInt(contextRounds.value, 10)

  if (contextRounds.value === '' || isNaN(parsed) || parsed < 1) {
    contextRounds.value = 5
  } else {
    contextRounds.value = parsed
  }
}

// 设置变化时写入 IndexedDB
watch(contextRounds, async (value) => {
  const rounds = parseInt(value, 10)

  if (isNaN(rounds) || rounds < 1) {
    return
  }

  const saved = await getChatSettings(props.uid) ?? {}

  await saveChatSettings(props.uid, {
    ...saved,
    contextRounds: rounds
  })
})

function toggle() {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="memory-card">
    <div class="card-header" @click="toggle">
      <div class="card-header-left">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
        >
          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        </svg>

        <span class="card-title">记忆功能</span>
      </div>

      <svg
        class="chevron"
        :class="{ expanded: isExpanded }"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        stroke="currentColor"
        stroke-width="2.5"
        fill="none"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>

    <div class="card-body" :class="{ expanded: isExpanded }">
      <div class="card-body-inner">
        <div class="setting-row">
          <div class="setting-label">
            <span class="label-text">上下文深度</span>
            <span class="label-hint">发送时携带最近 N 回合</span>
          </div>

          <div class="input-row">
            <input
              v-model="contextRounds"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              class="depth-input"
              @input="onInput"
              @blur="onBlur"
            />

            <span class="unit-text">回合</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.memory-card {
  background: #ffffff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(255, 183, 210, 0.25);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  user-select: none;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e07aa0;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.chevron {
  color: #bbb;
  transition: transform 0.25s ease;
}

.chevron.expanded {
  transform: rotate(180deg);
}

.card-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.card-body.expanded {
  max-height: 300px;
}

.card-body-inner {
  padding: 0 16px 16px;
  border-top: 1px solid #fde8f0;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  gap: 12px;
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.label-hint {
  font-size: 12px;
  color: #aaa;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.depth-input {
  width: 56px;
  height: 32px;
  text-align: center;
  border: 1.5px solid #ffb7d2;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  outline: none;
  background: #fff;
}

.depth-input:focus {
  border-color: #e07aa0;
}

.unit-text {
  font-size: 13px;
  color: #888;
  white-space: nowrap;
}
</style>
