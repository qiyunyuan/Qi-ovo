<script setup>
</script>

<template>
  <div class="page">
      <div class="screen">
        <slot></slot>
      </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #fcf2f5;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 手机屏幕 */
.screen {
  width: 380px;
  height: 750px;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  background: #b6dcfd;
}
</style>
