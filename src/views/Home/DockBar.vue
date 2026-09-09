<script setup>
import AppIcon from './AppIcon.vue'

const dockApps = [
  {
    id: 1,
    name: '电话',
    icon: '📞'
  },
  {
    id: 2,
    name: '短信',
    icon: '💬'
  },
  {
    id: 3,
    name: '设置',
    icon: '⚙️'
  },
  {
    id: 4,
    name: '音乐',
    icon: '🎵'
  }
]
</script>

<template>
  <div class="dock">
    <AppIcon
      v-for="app in dockApps"
      :key="app.id"
      :icon="app.icon"
      :name="app.name"
    />
  </div>
</template>

<style scoped>
.dock {
  height: 94px;
  padding: 10px 12px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px);
  border-radius: 26px;
}
</style>
