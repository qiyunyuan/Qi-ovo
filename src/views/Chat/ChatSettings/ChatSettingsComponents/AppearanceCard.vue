<script setup>
import { ref, onMounted } from 'vue'
import { getChatSettings, saveChatSettings } from '@/services/chatSettingsDb'

const props = defineProps({
  uid: {
    type: String,
    required: true
  }
})

const isExpanded = ref(false)

// 默认都开启
const showBubbleTime = ref(true)
const showChatTimeDivider = ref(true)

onMounted(async () => {
  const saved = await getChatSettings(props.uid)

  // 只有数据库明确保存过 true / false 才覆盖默认值
  if (typeof saved?.showBubbleTime === 'boolean') {
    showBubbleTime.value = saved.showBubbleTime
  }

  if (typeof saved?.showChatTimeDivider === 'boolean') {
    showChatTimeDivider.value = saved.showChatTimeDivider
  }
})

async function saveAppearanceSettings() {
  const saved = await getChatSettings(props.uid) ?? {}

  await saveChatSettings(props.uid, {
    ...saved,
    showBubbleTime: showBubbleTime.value,
    showChatTimeDivider: showChatTimeDivider.value
  })
}

function toggle() {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="appearance-card">
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
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 2v3"></path>
          <path d="M12 19v3"></path>
          <path d="m4.93 4.93 2.12 2.12"></path>
          <path d="m16.95 16.95 2.12 2.12"></path>
          <path d="M2 12h3"></path>
          <path d="M19 12h3"></path>
          <path d="m4.93 19.07 2.12-2.12"></path>
          <path d="m16.95 7.05 2.12-2.12"></path>
        </svg>
        <span class="card-title">外观设定</span>
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
            <span class="label-text">显示气泡时间</span>
            <span class="label-hint">在每条消息气泡下方显示发送时间</span>
          </div>

          <label class="switch" @click.stop>
            <input
              v-model="showBubbleTime"
              type="checkbox"
              @change="saveAppearanceSettings"
            />
            <span class="slider"></span>
          </label>
        </div>

        <div class="setting-row">
          <div class="setting-label">
            <span class="label-text">显示聊天时间条</span>
            <span class="label-hint">间隔 5 分钟或跨天时显示时间</span>
          </div>

          <label class="switch" @click.stop>
            <input
              v-model="showChatTimeDivider"
              type="checkbox"
              @change="saveAppearanceSettings"
            />
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.appearance-card {
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
  padding: 0 16px 8px;
  border-top: 1px solid #fde8f0;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
}

.setting-row + .setting-row {
  border-top: 1px solid #fff0f5;
}

.setting-label {
  display: flex;
  min-width: 0;
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

/* 开关 */
.switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 26px;
  flex-shrink: 0;
  cursor: pointer;
}

.switch input {
  width: 0;
  height: 0;
  opacity: 0;
}

.slider {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: #ddd;
  transition: 0.2s;
}

.slider::before {
  position: absolute;
  bottom: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  content: '';
  transition: 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background: #ff9fc5;
}

input:checked + .slider::before {
  transform: translateX(20px);
}
</style>
