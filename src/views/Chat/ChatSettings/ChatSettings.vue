<script setup>
import { useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profile'
import PhoneFrame from '../../../components/PhoneFrame.vue'
import MemoryCard from './ChatSettingsComponents/MemoryCard.vue'
import AppearanceCard from './ChatSettingsComponents/AppearanceCard.vue'

const router = useRouter()
const profileStore = useProfileStore()

function goBack() {
  router.back()
}
</script>

<template>
    <PhoneFrame>
  <div class="chat-settings-screen">
    <div class="sys-app-header">
      <div class="sys-header-btn" @click="goBack">
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" fill="none">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </div>
      <div class="sys-header-title">
        <span class="header-name">聊天设定</span>
      </div>
      <div class="sys-header-btn" style="visibility: hidden;">
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" fill="none">
          <circle cx="12" cy="12" r="1"></circle>
        </svg>
      </div>
    </div>

    <div class="settings-content">
      <!-- uid 加载完成后再挂载，避免 onMounted 读不到 uid -->
      <template v-if="profileStore.info?.uid">
        <MemoryCard :uid="profileStore.info.uid" />
        <AppearanceCard :uid="profileStore.info.uid" />
      </template>
    </div>
  </div>
  </PhoneFrame>
</template>

<style scoped>
.chat-settings-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff5f8;
}
.sys-app-header {
  height: 60px;
  background-color: #ffb7d2;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  font-weight: bold;
  flex-shrink: 0;
}
.sys-header-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
}
.sys-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-name {
  font-size: 16px;
}
.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
