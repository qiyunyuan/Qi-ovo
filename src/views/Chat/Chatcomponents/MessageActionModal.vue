<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['close', 'delete'])

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  message: {
    type: Object,
    default: null
  }
})

function handleDelete() {
  emit('delete', props.message)
  emit('close')
}

function handleClose() {
  emit('close')
}

function handleMaskClick(e) {
  // 只有点击遮罩层本身才关闭，点击内容区域不关闭
  if (e.target === e.currentTarget) {
    handleClose()
  }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-mask" @click="handleMaskClick">
      <div class="modal-container">
        <div class="action-list">
          <button class="action-item delete" @click="handleDelete">
            删除
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-container {
  width: 280px;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-list {
  display: flex;
  flex-direction: column;
}

.action-item {
  width: 100%;
  padding: 16px;
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-item:active {
  background-color: #f5f5f5;
}

.action-item.delete {
  color: #ff4d4f;
  font-weight: 500;
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}
</style>
