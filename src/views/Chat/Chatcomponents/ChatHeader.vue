<script setup>
import { useRouter } from 'vue-router'

defineProps({
  title: {
    type: String,
    default: 'chat'
  }
})

const router = useRouter()

function goBack() {
  router.push('/')
}

function goToSettings() {
  router.push('/chat-settings')
}
</script>

<template>
  <div class="sys-app-header">
    <div class="sys-header-btn" @click="goBack">
      <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" fill="none">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </div>

    <div class="sys-header-title">
      <span class="header-name">{{ title }}</span>
    </div>

    <div class="sys-header-btn" @click="goToSettings">
      <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" fill="none">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="19" cy="12" r="1"></circle>
        <circle cx="5" cy="12" r="1"></circle>
      </svg>
    </div>
  </div>
</template>

<style scoped>
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
  min-width: 0;
}
.header-name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
