<script setup>
import { useRouter } from 'vue-router'

import PhoneFrame from '../../components/PhoneFrame.vue'
import AppIcon from './AppIcon.vue'
import DockBar from './DockBar.vue'

const router = useRouter()

const desktopApps = [
  {
    id: 1,
    name: '聊天',
    icon: '💬',
    path: '/chat'
  },
  {
    id: 2,
    name: '设置',
    icon: '⚙️',
    path: '/settings'
  },
  {
    id: 11,
    name: '资料',
    icon: '💑',
    path: '/info-app'
  },
  {
    id: 12,
    name: '提示词',
    icon: '📝',
    path: '/prompt'
  },
  {
    id: 13,
    name: '调试',
    icon: '🔧',
    path: '/debug/prompt'
  },
  {
    id: 3,
    name: '相册',
    icon: '🖼️',
    path: ''
  },
  {
    id: 4,
    name: '天气',
    icon: '☀️',
    path: ''
  },
  {
    id: 5,
    name: '日历',
    icon: '📅',
    path: ''
  },
  {
    id: 6,
    name: '备忘录',
    icon: '📝',
    path: ''
  },
  {
    id: 7,
    name: '地图',
    icon: '🗺️',
    path: ''
  },
  {
    id: 8,
    name: '商店',
    icon: '🛒',
    path: ''
  }
]

function openApp(app) {
  if (app.path) {
    router.push(app.path)
  }
}
</script>

<template>
  <PhoneFrame>
    <div class="home-screen">
      <div class="status-bar">
        <span>23:17</span>
        <span>📶 🔋</span>
      </div>

      <div class="desktop-grid">
        <AppIcon
          v-for="app in desktopApps"
          :key="app.id"
          :icon="app.icon"
          :name="app.name"
          @click="openApp(app)"
        />
      </div>

      <DockBar />
    </div>
  </PhoneFrame>
</template>

<style scoped>
.home-screen {
  width: 100%;
  height: 100%;
  padding: 18px;
  display: flex;
  flex-direction: column;
}

.status-bar {
  height: 30px;
  color: white;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.desktop-grid {
  flex: 1;
  padding-top: 28px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(6, 82px);
  justify-items: center;
  align-items: start;
}
</style>
