// src/services/promptDb.js
import Dexie from 'dexie'

export const promptDb = new Dexie('qi_yunovo_prompt_db')

promptDb.version(1).stores({
  presets: 'id'
})

promptDb.version(2).stores({
  presets: 'id'
}).upgrade(async (tx) => {
  await tx.table('presets').toCollection().modify((preset) => {
    const normalized = normalizePreset(preset)
    Object.keys(preset).forEach((key) => {
      delete preset[key]
    })
    Object.assign(preset, normalized)
  })
})

function createSection(data = {}) {
  const now = Date.now().toString(36)
  return {
    id: data.id || `s-${now}-${Math.random().toString(36).slice(2, 6)}`,
    name: (data.name || '').trim() || '未命名板块',
    prompt: data.prompt || '',
    enabled: data.enabled !== false,
    role: ['system', 'user', 'assistant'].includes(data.role) ? data.role : 'system',
    position: data.position === 'depth' ? 'depth' : 'sequence',
    depth: Number.isFinite(Number(data.depth)) ? Math.max(0, Number(data.depth)) : 1,
    expanded: data.expanded === true,
    // 新增：固定板块标识
    builtin: !!data.builtin,
      builtinType: ['char', 'user', 'chatHistory', 'messageFormat'].includes(data.builtinType) ? data.builtinType : null

  }
}

function createDefaultParams(params = {}) {
  return {
    temperature: Number.isFinite(Number(params.temperature)) ? Number(params.temperature) : 1,
    topP: Number.isFinite(Number(params.topP)) ? Number(params.topP) : 1,
    maxTokens: Number.isFinite(Number(params.maxTokens)) ? Number(params.maxTokens) : 2048,
    frequencyPenalty: Number.isFinite(Number(params.frequencyPenalty)) ? Number(params.frequencyPenalty) : 0,
    presencePenalty: Number.isFinite(Number(params.presencePenalty)) ? Number(params.presencePenalty) : 0
  }
}

function normalizePreset(data = {}) {
  const legacyContent = data.content || ''
  const sections = Array.isArray(data.sections) && data.sections.length
    ? data.sections.map(createSection)
    : [createSection({
        name: '主提示词',
        prompt: legacyContent,
        role: 'system',
        position: 'sequence',
        depth: 1
      })]

  return {
    id: data.id,
    name: (data.name || '').trim() || '未命名预设',
    // 新增：预设启用状态（启用中的是正在使用的，全局只能有一个）
    enabled: data.enabled === true,
    params: createDefaultParams(data.params),
    sections,
    createdAt: data.createdAt || Date.now(),
    updatedAt: data.updatedAt || Date.now()
  }
}

export function getPresetPreview(preset) {
  const firstEnabled = (preset.sections || []).find((section) => section.enabled && section.prompt.trim())
  return firstEnabled?.prompt || ''
}

export function getPresetSectionCount(preset) {
  return Array.isArray(preset.sections) ? preset.sections.length : 0
}

// ★ 空数据库时自动导入内置预设
export async function ensureSeed() {
  const count = await promptDb.presets.count()
  if (count === 0) {
    // 导入内置预设
    const { presetExinyixuV33 } = await import('./presets/e心一叙v3.3.js')
    await createPreset({ ...presetExinyixuV33, enabled: true })
  }
}

export async function getPresets() {
  const all = await promptDb.presets.toArray()
  return all
    .map(normalizePreset)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export async function getPreset(id) {
  const preset = await promptDb.presets.get(id)
  return preset ? normalizePreset(preset) : null
}

export async function createPreset(data) {
  const now = Date.now()
  const normalized = normalizePreset({
    ...data,
    id: 'p-' + now.toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: now,
    updatedAt: now
  })
  await promptDb.presets.add(normalized)
  return normalized
}

export async function updatePreset(id, data) {
  const existing = await promptDb.presets.get(id)
  if (!existing) return null
  const updated = normalizePreset({
    ...existing,
    ...data,
    id,
    updatedAt: Date.now()
  })
  await promptDb.presets.put(updated)
  return updated
}

export async function deletePreset(id) {
  await promptDb.presets.delete(id)
}

// ★ 切换预设启用/停用；启用时保证全局只有一个启用中的预设
export async function setPresetEnabled(id, enabled) {
  const preset = await promptDb.presets.get(id)
  if (!preset) return null

  if (enabled) {
    // 先把其他所有预设停用
    await promptDb.presets
      .toCollection()
      .filter((p) => p.id !== id)
      .modify((p) => {
        if (p.enabled) p.enabled = false
      })
  }

  const updated = normalizePreset({
    ...preset,
    enabled,
    updatedAt: Date.now()
  })
  await promptDb.presets.put(updated)
  return updated
}

// ★ 复制预设为新预设（新 id、新板块 id、默认停用，名称加“ 副本”）
export async function duplicatePreset(id) {
  const preset = await promptDb.presets.get(id)
  if (!preset) return null

  const now = Date.now()
  const normalized = normalizePreset({
    ...preset,
    id: 'p-' + now.toString(36) + Math.random().toString(36).slice(2, 6),
    name: (preset.name || '未命名预设') + ' 副本',
    enabled: false,
    sections: (preset.sections || []).map((s) => {
      const { id: _oldId, ...rest } = s
      return createSection(rest)
    }),
    createdAt: now,
    updatedAt: now
  })
  await promptDb.presets.add(normalized)
  return normalized
}
