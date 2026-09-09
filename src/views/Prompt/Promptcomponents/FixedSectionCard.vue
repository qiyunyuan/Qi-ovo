<script setup>
const props = defineProps({
  section: { type: Object, required: true },
  roleOptions: { type: Array, default: () => [] }
})
defineEmits(['drag-down', 'drag-up'])
</script>

<template>
  <article
    class="section-card is-builtin"
    :data-index="props.section.index"
  >
    <!-- 条目栏：长按移动 / 固定名称 / 角色选择 / 锁定提示 -->
    <div class="section-bar">
      <button
        type="button"
        class="drag-handle"
        title="长按拖动排序"
        @pointerdown.prevent="$emit('drag-down', $event)"
        @pointerup="$emit('drag-up')"
        @pointercancel="$emit('drag-up')"
        @pointerleave="$emit('drag-up')"
        @contextmenu.prevent
      >
        <span class="grip">≡</span>
      </button>

      <span class="section-name-static">{{ section.name }}</span>

      <!-- 角色选择（可切换 system / user / assistant） -->
      <select v-model="section.role" class="role-select">
        <option
          v-for="item in roleOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>

      <span class="lock-icon" title="固定动态板块不可删除、不可停用">🔒</span>

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
.section-card.is-builtin {
  border-left: 3px solid #6b7fd7;
  background: #f8faff;
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
.section-name-static {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: #4d4250;
  padding: 8px 10px;
}
.builtin-badge {
  font-size: 11px;
  font-weight: 700;
  color: #6b7fd7;
  background: #eef1fe;
  border-radius: 999px;
  padding: 2px 8px;
  flex-shrink: 0;
}
.lock-icon {
  font-size: 12px;
  flex-shrink: 0;
  color: #8a7a90;
}
.role-select {
  border: 1px solid #e3e5eb;
  border-radius: 10px;
  padding: 7px 10px;
  font-size: 13px;
  font-family: inherit;
  background: #fff;
  color: #4b5fb8;
  font-weight: 600;
  outline: none;
  cursor: pointer;
  flex-shrink: 0;
}
.role-select:focus {
  border-color: #6b7fd7;
}
</style>
