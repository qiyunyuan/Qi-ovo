<script setup>
const props = defineProps({
  section: { type: Object, required: true },
  roleOptions: { type: Array, default: () => [] },
  positionOptions: { type: Array, default: () => [] }
})
defineEmits(['drag-down', 'drag-up', 'remove', 'toggle-expand'])
</script>

<template>
  <article class="section-card" :class="{ 'is-disabled': !section.enabled }">
    <!-- 条目栏：长按 / 名称可编辑 / 展开收起 / 开关 / 删除 -->
    <div class="section-bar">
      <button
        type="button"
        class="drag-handle"
        title="长按拖动排序"
        @pointerdown.prevent="$emit('drag-down', $event)"
        @pointerup="$emit('drag-up')"
        @pointercancel="$emit('drag-up')"
        @pointerleave="$emit('drag-up')"
      >
        <span class="grip">≡</span>
      </button>

      <input v-model.trim="section.name" class="section-name" type="text" placeholder="板块名称" />

      <button
        type="button"
        class="icon-btn expand-btn"
        :title="section.expanded ? '收起' : '展开'"
        @click="$emit('toggle-expand')"
      >
        <span class="chevron small" :class="{ open: section.expanded }">›</span>
      </button>

      <button
        type="button"
        class="capsule"
        :class="{ on: section.enabled }"
        role="switch"
        :aria-checked="section.enabled"
        :title="section.enabled ? '启用中' : '已停用'"
        @click="section.enabled = !section.enabled"
      >
        <span class="capsule-thumb"></span>
      </button>

      <button type="button" class="icon-btn danger" title="删除板块" @click="$emit('remove')">✕</button>
    </div>

    <!-- 展开区：提示词 / 角色 / 位置 / 深度 -->
    <div v-show="section.expanded" class="section-body">
      <label class="field">
        <span class="label">提示词</span>
        <textarea v-model="section.prompt" rows="6" placeholder="填写该板块的提示词内容"></textarea>
      </label>

      <div class="grid two-col">
        <label class="field">
          <span class="label">角色</span>
          <select v-model="section.role">
            <option v-for="item in roleOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </label>

        <label class="field">
          <span class="label">位置</span>
          <select v-model="section.position">
            <option v-for="item in positionOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </label>

        <label v-if="section.position === 'depth'" class="field">
          <span class="label">深度</span>
          <input v-model.number="section.depth" type="number" min="0" step="1" />
        </label>
      </div>
    </div>
  </article>
</template>

<style scoped>
.section-card {
  position: relative;
  border: 1px solid #e7e8ef;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: #f3f4f8;
  color: #8a7a90;
  padding: 6px 8px;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease;
}
.drag-handle:active {
  background: #e3e6f8;
  color: #4b5fb8;
  cursor: grabbing;
}
.grip {
  font-size: 15px;
  line-height: 1;
  letter-spacing: -2px;
}
.section-name {
  flex: 1;
  min-width: 0;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #4d4250;
  padding: 8px 10px;
  outline: none;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.section-name:hover {
  background: #f8f9fd;
}
.section-name:focus {
  border-color: #6b7fd7;
  background: #fff;
}
.section-name::placeholder {
  color: #c0b8c4;
  font-weight: 400;
}
.chevron.small {
  font-size: 15px;
  line-height: 1;
  transition: transform 0.2s ease;
}
.chevron.small.open {
  transform: rotate(90deg);
}
.expand-btn {
  width: 34px;
  padding: 7px 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.capsule {
  position: relative;
  width: 44px;
  height: 26px;
  border: none;
  border-radius: 999px;
  background: #d8dbe3;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition: background 0.2s ease;
}
.capsule .capsule-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease;
}
.capsule.on {
  background: #6b7fd7;
}
.capsule.on .capsule-thumb {
  transform: translateX(18px);
}
.section-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px dashed #e7e8ef;
  padding-top: 12px;
}
.icon-btn {
  border: none;
  border-radius: 10px;
  padding: 7px 10px;
  font-size: 12px;
  cursor: pointer;
  background: #eef1fe;
  color: #4b5fb8;
}
.icon-btn.danger {
  background: #fee;
  color: #e5484d;
}
.grid {
  display: grid;
  gap: 12px;
}
.two-col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.label {
  font-size: 12px;
  font-weight: 600;
  color: #8a7a90;
}
.field input,
.field textarea,
.field select {
  border: 1px solid #e3e5eb;
  border-radius: 12px;
  padding: 11px 12px;
  font-size: 14px;
  font-family: inherit;
  background: #fff;
  outline: none;
  resize: vertical;
}
.field input:focus,
.field textarea:focus,
.field select:focus {
  border-color: #6b7fd7;
}
@media (max-width: 420px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
/* 停用状态：整卡变灰、虚线边框，与开启状态明显区分 */
.section-card.is-disabled {
  background: #f8f7fa;
  border-color: #ddd9e3;
  border-style: dashed;
}
.section-card.is-disabled .drag-handle {
  background: #efedf2;
  color: #bdb4c4;
}
.section-card.is-disabled .drag-handle:active {
  cursor: not-allowed;
}
.section-card.is-disabled .section-name {
  color: #a89fb1;
}
.section-card.is-disabled .expand-btn {
  opacity: 0.6;
}
.section-card.is-disabled .section-body {
  opacity: 0.55;
  filter: grayscale(0.3);
}
.disabled-badge {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: #9a91a5;
  background: #efedf2;
  border-radius: 999px;
  padding: 3px 9px;
}

</style>
