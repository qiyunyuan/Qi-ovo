<script setup>
defineProps({
  icon: {
    type: String,
    default: '📱'
  },
  name: {
    type: String,
    default: 'App'
  }
})
</script>

<template>
  <div class="app-icon">
    <div class="icon-box">
      {{ icon }}
    </div>
    <div class="app-name">
      {{ name }}
    </div>
  </div>
</template>

<style scoped>
.app-icon {
  width: 60px;
  text-align: center;
  color: white;
  cursor: pointer;
}

.icon-box {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  margin: 0 auto 6px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.app-name {
  font-size: 12px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}
</style>
