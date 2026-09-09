<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PhoneFrame from '../../components/PhoneFrame.vue'
import {
  getPresets,
  deletePreset,
  setPresetEnabled,
  duplicatePreset,
  ensureSeed
} from '../../services/Prompt/promptDb.js'

const router = useRouter()
const presets = ref([])

async function refresh() {
  presets.value = await getPresets()
}

function goEdit(id) {
  router.push(`/prompt/edit/${id}`)
}

function goCreate() {
  router.push('/prompt/edit/new')
}

async function handleDelete(preset) {
  if (confirm(`确定删除「${preset.name}」吗？`)) {
    await deletePreset(preset.id)
    await refresh()
  }
}

async function handleToggleEnabled(preset) {
  await setPresetEnabled(preset.id, !preset.enabled)
  await refresh()
}

async function handleDuplicate(preset) {
  const copy = await duplicatePreset(preset.id)
  if (copy) await refresh()
}

onMounted(async () => {
  await ensureSeed()
  await refresh()
})
</script>

<template>
  <PhoneFrame>
    <div class="prompt-home">
      <div class="page-header">
        <div class="header-btn" @click="router.push('/')">‹</div>
        <div class="header-title">提示词预设</div>
        <div class="header-btn" @click="goCreate">＋</div>
      </div>

      <p class="hint">共 {{ presets.length }} 条预设</p>

      <ul class="preset-list">
        <li
          v-for="p in presets"
          :key="p.id"
          class="preset-card"
          :class="{ active: p.enabled }"
        >
          <div class="preset-name-row">
            <h3 class="preset-name">{{ p.name }}</h3>
            <span v-if="p.enabled" class="enabled-tag">使用中</span>
          </div>

          <div class="preset-actions">
            <button
              class="btn toggle"
              :class="{ off: p.enabled }"
              @click="handleToggleEnabled(p)"
            >
              {{ p.enabled ? '停用' : '启用' }}
            </button>
            <button class="btn edit" @click="goEdit(p.id)">编辑</button>
            <button class="btn copy" @click="handleDuplicate(p)">复制</button>
            <button class="btn danger" @click="handleDelete(p)">删除</button>
          </div>
        </li>
      </ul>

      <div v-if="presets.length === 0" class="empty">
        <p>还没有预设，点击右上角 ＋ 新建一个</p>
      </div>
    </div>
  </PhoneFrame>
</template>

<style scoped>
.prompt-home {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #eef1fe 0%, #f8f0ff 100%);
  overflow-y: auto;
}

.page-header {
  height: 60px;
  background-color: #6b7fd7;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.header-btn {
  width: 40px;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  user-select: none;
}

.header-title {
  font-size: 16px;
}

.hint {
  font-size: 12px;
  color: #8a7a90;
  padding: 12px 16px 4px;
  margin: 0;
}

.preset-list {
  list-style: none;
  flex: 1;
  margin: 0;
  padding: 8px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}

.preset-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 3px 14px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #6b7fd7;
}

/* 启用中的预设 */
.preset-card.active {
  border-left-color: #2f9e44;
  background: #f3fbf4;
}

.preset-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.preset-name {
  margin: 0;
  font-size: 16px;
  color: #3d2a38;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.enabled-tag {
  font-size: 11px;
  font-weight: 600;
  color: #2f9e44;
  background: #e6f6ea;
  border-radius: 999px;
  padding: 2px 8px;
  white-space: nowrap;
  flex-shrink: 0;
}

.preset-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  border: none;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
}

.btn.toggle {
  background: #2f9e44;
  color: #fff;
}

.btn.toggle.off {
  background: #e6f6ea;
  color: #2f9e44;
}

.btn.edit {
  background: #6b7fd7;
  color: #fff;
}

.btn.copy {
  background: #eef4ff;
  color: #3a6fd8;
}

.btn.danger {
  background: #fee;
  color: #e5484d;
}

.empty {
  text-align: center;
  color: #999;
  padding: 60px 0;
  font-size: 14px;
}
</style>
