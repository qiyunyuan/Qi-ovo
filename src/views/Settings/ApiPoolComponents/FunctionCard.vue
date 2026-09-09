<!-- src/views/Settings/ApiPoolComponents/FunctionCard.vue -->
<script setup>
import { ref } from 'vue'

const props = defineProps({
  title:   { type: String, required: true },
  icon:    { type: String, default: '⚙️' },
  entries: { type: Array,  default: () => [] }  // [{ apiName, model }]
})

const emit = defineEmits(['add', 'remove'])

const expanded = ref(false)
</script>

<template>
  <div class="func-card">

    <!-- ── 收起状态：标题行 ─────────────────── -->
    <div class="func-header" @click="expanded = !expanded">
      <div class="func-header-left">
        <span class="func-icon">{{ icon }}</span>
        <span class="func-title">{{ title }}</span>
        <span class="func-count" v-if="entries.length">{{ entries.length }}</span>
      </div>
      <div class="func-header-right">
        <!-- 新增按钮：阻止冒泡，不触发折叠 -->
        <button class="add-btn" @click.stop="$emit('add')" title="新增 API">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor"
               stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <!-- 折叠箭头 -->
        <svg class="fold-arrow" :class="{ open: expanded }"
             viewBox="0 0 24 24" width="18" height="18" stroke="#c0c0c0"
             stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>

    <!-- ── 展开内容 ────────────────────────── -->
    <Transition name="expand">
      <div v-if="expanded" class="func-body">
        <!-- 空状态 -->
        <div v-if="entries.length === 0" class="empty-entry">
          还没有配置，点击右上角 + 添加吧 ~
        </div>

        <!-- API 条目列表 -->
        <div v-else class="entry-list">
          <div
            v-for="(entry, idx) in entries"
            :key="idx"
            class="entry-row"
          >
            <div class="entry-info">
              <span class="entry-api-name">{{ entry.apiName }}</span>
              <span class="entry-sep">·</span>
              <span class="entry-model">{{ entry.model }}</span>
            </div>
            <button class="remove-btn" @click="$emit('remove', idx)" title="移除">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor"
                   stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* ── 卡片外框 ─────────────────────────────── */
.func-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(255, 183, 210, 0.15);
  overflow: hidden;
}

/* ── 标题行 ───────────────────────────────── */
.func-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.func-header:active {
  background-color: #fff0f3;
}

.func-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.func-icon {
  font-size: 1.2rem;
}

.func-title {
  font-weight: bold;
  color: #444;
  font-size: 1rem;
}

.func-count {
  background: linear-gradient(135deg, #ffb3c6 0%, #ff8da1 100%);
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  border-radius: 999px;
  padding: 2px 7px;
  line-height: 1.4;
}

.func-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ── 新增按钮 ─────────────────────────────── */
.add-btn {
  background: none;
  border: none;
  color: #ff8da1;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  transition: transform 0.2s;
}

.add-btn:active {
  transform: scale(0.85);
}

/* ── 折叠箭头 ─────────────────────────────── */
.fold-arrow {
  transition: transform 0.3s ease;
}

.fold-arrow.open {
  transform: rotate(180deg);
}

/* ── 展开区域 ─────────────────────────────── */
.func-body {
  border-top: 1px solid #fff0f3;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── 空状态 ───────────────────────────────── */
.empty-entry {
  text-align: center;
  color: #ffb3c6;
  font-size: 0.82rem;
  padding: 10px 0;
}

/* ── 条目列表 ─────────────────────────────── */
.entry-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.entry-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fffcfd;
  border: 1.5px solid #ffe5e5;
  border-radius: 14px;
  padding: 10px 14px;
}

.entry-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.entry-api-name {
  font-size: 0.88rem;
  font-weight: bold;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

.entry-sep {
  color: #ddd;
  flex-shrink: 0;
}

.entry-model {
  font-size: 0.82rem;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 移除按钮 ─────────────────────────────── */
.remove-btn {
  background: none;
  border: none;
  color: #ffb3c6;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  flex-shrink: 0;
  margin-left: 8px;
  transition: color 0.2s, transform 0.2s;
}

.remove-btn:active {
  color: #e53935;
  transform: scale(0.85);
}

/* ── 展开折叠动画 ─────────────────────────── */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 400px;
  opacity: 1;
}
</style>
