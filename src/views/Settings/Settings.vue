<script setup>
import { useRouter } from 'vue-router'
import PhoneFrame from '../../components/PhoneFrame.vue'

const router = useRouter()

// 设置分组，以后加新的设置项就在这里加一行即可
const settingGroups = [
  {
    title: '通用',
    items: [
      { id: 'api', name: 'API 管理', icon: '🔑', desc: '配置 AI 接口', path: '/api-manager' },
      { id: 'apiPool', name: 'API 轮询池', icon: '🔄', desc: '配置各功能使用的 API', path: '/api-pool' },
      { id: 'appearance', name: '外观', icon: '🎨', desc: '主题与壁纸', path: '' },
      { id: 'notification', name: '通知', icon: '🔔', desc: '消息提醒', path: '' }
    ]
  },
  {
    title: '其他',
    items: [
      { id: 'storage', name: '存储空间', icon: '💾', desc: '', path: '' },
      { id: 'about', name: '关于', icon: 'ℹ️', desc: '祁韵布丁机 v1.0.0', path: '' }
    ]
  }
]

function openItem(item) {
  if (item.path) {
    router.push(item.path)
  }
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <PhoneFrame>
    <div class="settings-page">
      <!-- 标题栏 -->
      <div class="sys-app-header">
        <div class="sys-header-btn" @click="goBack">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </div>
        <div class="sys-header-title">设置</div>
        <div class="sys-header-btn" style="opacity: 0; pointer-events: none;">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </div>
      </div>

      <!-- 设置分组列表 -->
      <div class="settings-content">
        <div v-for="group in settingGroups" :key="group.title" class="setting-group">
          <div class="group-title">{{ group.title }}</div>
          <div class="setting-card">
            <div
              v-for="item in group.items"
              :key="item.id"
              class="setting-row"
              :class="{ disabled: !item.path }"
              @click="openItem(item)"
            >
              <div class="row-icon">{{ item.icon }}</div>
              <div class="row-info">
                <div class="row-name">{{ item.name }}</div>
                <div v-if="item.desc" class="row-desc">{{ item.desc }}</div>
              </div>
              <svg v-if="item.path" class="row-arrow" viewBox="0 0 24 24" width="18" height="18" stroke="#c0c0c0" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PhoneFrame>
</template>

<style scoped>
/* ================== 基础布局 ================== */
.settings-page {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fffcfd;
  overflow: hidden;
}

.sys-app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: white;
  border-bottom: 1px solid #fff0f3;
  z-index: 10;
}

.sys-header-title {
  font-weight: bold;
  font-size: 1.1rem;
  color: #444;
}

.sys-header-btn {
  color: #ff8da1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
  padding: 4px;
}

.sys-header-btn:active {
  transform: scale(0.9);
}

/* ================== 设置列表 ================== */
.settings-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.setting-group {
  margin-bottom: 24px;
}

.group-title {
  color: #ff8da1;
  font-size: 0.9rem;
  font-weight: bold;
  margin: 0 0 10px 6px;
  letter-spacing: 0.5px;
}

.setting-card {
  background-color: white;
  border-radius: 20px;
  padding: 4px 16px;
  box-shadow: 0 4px 12px rgba(255, 183, 210, 0.15);
  overflow: hidden;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #fff0f3;
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-row:active {
  background-color: #fff0f3;
}

.setting-row.disabled {
  cursor: default;
}

.setting-row.disabled:active {
  background-color: transparent;
}

.row-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fff0f3 0%, #ffe0e8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.row-info {
  flex: 1;
  min-width: 0;
}

.row-name {
  font-size: 1rem;
  font-weight: bold;
  color: #444;
}

.row-desc {
  font-size: 0.75rem;
  color: #b0b0b0;
  margin-top: 2px;
}

.row-arrow {
  flex-shrink: 0;
}
</style>
