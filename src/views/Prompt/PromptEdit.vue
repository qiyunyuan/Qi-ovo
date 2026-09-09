<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PhoneFrame from '../../components/PhoneFrame.vue'
import { getPreset, createPreset, updatePreset } from '../../services/Prompt/promptDb.js'
import { createBuiltinSections } from '../../services/Prompt/builtinSections.js'
import PromptParams from './Promptcomponents/PromptParams.vue'
import PromptSectionList from './Promptcomponents/PromptSectionList.vue'

const route = useRoute()
const router = useRouter()

const presetId = computed(() => route.params.id)
const isNew = computed(() => !presetId.value || presetId.value === 'new')

const roleOptions = [
  { label: 'system', value: 'system' },
  { label: 'user', value: 'user' },
  { label: 'assistant', value: 'assistant' }
]

const positionOptions = [
  { label: '按顺序', value: 'sequence' },
  { label: '历史深度', value: 'depth' }
]

function createSection(data = {}) {
  return {
    id: data.id || `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: data.name || '自定义板块',
    prompt: data.prompt || '',
    enabled: data.enabled !== false,
    role: data.role || 'system',
    position: data.position || 'sequence',
    depth: Number.isFinite(Number(data.depth)) ? Number(data.depth) : 1,
    expanded: data.expanded === true, // 默认收起
    builtin: !!data.builtin,
    builtinType: ['char', 'user', 'chatHistory', 'messageFormat'].includes(data.builtinType) ? data.builtinType : null
  }
}

// 新预设：两个固定板块
function getNewSections() {
  return createBuiltinSections().map(s => createSection(s))
}

const form = ref({
  name: '',
  params: {
    temperature: 0.7,
    topP: 1,
    maxTokens: 2048,
    frequencyPenalty: 0,
    presencePenalty: 0
  },
  sections: getNewSections()
})

// 参数卡片默认为收起
const paramsExpanded = ref(false)

const errorMsg = ref('')
const saving = ref(false)

onMounted(async () => {
  if (isNew.value) {
    return
  }
  const preset = await getPreset(presetId.value)
  if (!preset) {
    errorMsg.value = '未找到该预设，可能已被删除'
    return
  }

  const sections = (preset.sections || []).map((section) => createSection(section))

  // 确保存在固定板块；旧预设缺少则自动补上
  const requiredTypes = ['char', 'user', 'messageFormat', 'chatHistory']
  const builtin = createBuiltinSections().map(s => createSection(s))
  for (const type of requiredTypes) {
    if (!sections.some(s => s.builtin && s.builtinType === type)) {
      sections.push(builtin.find(s => s.builtinType === type))
    }
  }

  form.value = {
    name: preset.name || '',
    params: {
      temperature: preset.params?.temperature ?? 0.7,
      topP: preset.params?.topP ?? 1,
      maxTokens: preset.params?.maxTokens ?? 2048,
      frequencyPenalty: preset.params?.frequencyPenalty ?? 0,
      presencePenalty: preset.params?.presencePenalty ?? 0
    },
    sections
  }
})

function goBack() {
  router.push('/prompt')
}

function normalizeNumber(value, fallback) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function hasValidSection() {
  return form.value.sections.some((section) => section.prompt.trim() && !section.builtin)
}

async function save() {
  if (!form.value.name.trim()) {
    errorMsg.value = '请填写预设名称'
    return
  }
  if (!hasValidSection()) {
    errorMsg.value = '请至少填写一个板块提示词'
    return
  }

  saving.value = true
  errorMsg.value = ''

  const data = {
    name: form.value.name.trim(),
    params: {
      temperature: normalizeNumber(form.value.params.temperature, 0.7),
      topP: normalizeNumber(form.value.params.topP, 1),
      maxTokens: Math.max(0, Math.floor(normalizeNumber(form.value.params.maxTokens, 2048))),
      frequencyPenalty: normalizeNumber(form.value.params.frequencyPenalty, 0),
      presencePenalty: normalizeNumber(form.value.params.presencePenalty, 0)
    },
    sections: form.value.sections.map((section) => ({
      id: section.id,
      name: section.name.trim() || '未命名板块',
      prompt: section.prompt,
      enabled: !!section.enabled,
      role: section.role,
      position: section.position,
      depth: section.position === 'depth'
        ? Math.max(0, Math.floor(normalizeNumber(section.depth, 1)))
        : 1,
      expanded: !!section.expanded,
      builtin: !!section.builtin,
      builtinType: section.builtinType || null
    }))
  }

  if (isNew.value) await createPreset(data)
  else await updatePreset(presetId.value, data)

  saving.value = false
  router.push('/prompt')
}
</script>

<template>
  <PhoneFrame>
    <div class="prompt-edit">
      <!-- 标题栏 -->
      <div class="page-header">
        <button type="button" class="header-btn" @click="goBack">‹</button>
        <input
          v-model.trim="form.name"
          class="header-title-input"
          type="text"
          placeholder="预设名称"
        />
        <button type="button" class="header-save" @click="save" :disabled="saving">
          {{ saving ? '保存中' : '保存' }}
        </button>
      </div>

      <form class="edit-form" @submit.prevent="save">
        <PromptParams v-model:expanded="paramsExpanded" :params="form.params" />

        <PromptSectionList
          v-model="form.sections"
          :role-options="roleOptions"
          :position-options="positionOptions"
        />

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      </form>
    </div>
  </PhoneFrame>
</template>

<style scoped>
.prompt-edit {
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
  padding: 0 12px;
  font-weight: 700;
  flex-shrink: 0;
  gap: 8px;
}

.header-btn {
  width: 40px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  padding: 0;
  flex-shrink: 0;
}

.header-title-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  outline: none;
  padding: 6px 8px;
  border-bottom: 1px solid transparent;
}

.header-title-input:focus {
  border-bottom-color: rgba(255, 255, 255, 0.6);
}

.header-title-input::placeholder {
  color: rgba(255, 255, 255, 0.65);
}

.header-save {
  flex-shrink: 0;
  min-width: 58px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 7px 14px;
  cursor: pointer;
}

.header-save:disabled {
  opacity: 0.6;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 16px 24px;
}

.error {
  color: #e5484d;
  font-size: 13px;
  margin: 0;
}
</style>
