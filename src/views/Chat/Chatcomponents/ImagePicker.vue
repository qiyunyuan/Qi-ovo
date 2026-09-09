<script setup>
const emit = defineEmits(['send-image'])

function handleChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    event.target.value = ''
    return
  }

  const url = URL.createObjectURL(file)

  emit('send-image', {
    file,
    url,
    name: file.name,
    type: file.type,
    size: file.size
  })

  event.target.value = ''
}
</script>

<template>
  <label class="image-picker">
    <input
      class="image-input"
      type="file"
      accept="image/*"
      @change="handleChange"
    />

    <div class="drawer-icon">🖼️</div>
    <div class="drawer-label">照片</div>
  </label>
</template>

<style scoped>
.image-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.image-input {
  display: none;
}

.drawer-icon {
  width: 56px;
  height: 56px;
  background-color: #ffffff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.drawer-label {
  font-size: 12px;
  color: #666;
}
</style>
