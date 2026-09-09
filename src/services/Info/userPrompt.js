// src/services/Info/userPrompt.js
// 用户动态资料 → 提示词板块结构
// 职责：只把 profile store 的原始资料，按规则转成"结构化板块"
// 注意：不负责拼装！最终拼装顺序/参数/规则由未来的 promptBuilder.js 处理

// ---------------- 板块分组定义 ----------------
export const USER_GROUPS = [
  { id: 'basic',      title: '用户基本信息', purpose: 'chat' },    // 对话提示词用
  { id: 'appearance', title: '用户外貌',     purpose: 'visual' }   // 生图提示词用
]

// ---------------- 字段规则（key 对应 profile store 里的字段） ----------------
export const USER_FIELD_RULES = [
  { key: 'name',        label: '名字', group: 'basic',      format: 'kv', enabled: true },
  // id 默认不告诉 AI，未来想做「称呼规则」之类的再打开
  { key: 'id',          label: 'ID',   group: 'basic',      format: 'kv', enabled: false },
  { key: 'gender',      label: '性别', group: 'basic',      format: 'kv', enabled: true },
  { key: 'birthday',    label: '生日', group: 'basic',      format: 'kv', enabled: true },
  { key: 'nationality', label: '国籍', group: 'basic',      format: 'kv', enabled: true },
  { key: 'region',      label: '地区', group: 'basic',      format: 'kv', enabled: true },
  { key: 'timezone',    label: '时区', group: 'basic',      format: 'kv', enabled: true },
  { key: 'appearance',  label: '外貌', group: 'appearance', format: 'kv', enabled: true }
]

// ---------------- 核心方法：user 资料 → 板块结构 ----------------
// 入参：profile store 的 info（建议调用处先 toRaw）
// 返回：[{ id, title, purpose, lines: string[] }, ...]
export function buildUserBlocks(info) {
  const linesByGroup = {}   // groupId -> string[]

  for (const rule of USER_FIELD_RULES) {
    if (!rule.enabled) continue
    const value = info?.[rule.key]
    if (value == null || value === '') continue   // 动态资料：空的就不进 prompt

    const line = rule.format === 'raw'
      ? String(value)
      : `${rule.label}：${value}`

    if (!linesByGroup[rule.group]) linesByGroup[rule.group] = []
    linesByGroup[rule.group].push(line)
  }

  return USER_GROUPS
    .filter(g => linesByGroup[g.id]?.length)   // 整组为空就不输出
    .map(g => ({
      id: g.id,
      title: g.title,
      purpose: g.purpose,
      lines: linesByGroup[g.id]
    }))
}

// ---------------- 生成完整提示词字符串 ----------------
// 用于 PromptBuilder 拼接时调用
// 入参：profile store 的 info
// 返回：格式化的提示词字符串，如果没有数据则返回空字符串
export function generateUserPrompt(info) {
  const blocks = buildUserBlocks(info)
  
  // 只输出对话相关的 block（purpose: 'chat'）
  const chatBlocks = blocks.filter(b => b.purpose === 'chat')
  
  if (chatBlocks.length === 0) return ''
  
  // 将所有行合并
  const allLines = chatBlocks.flatMap(b => b.lines)
  
  return `<user_profile>\n${allLines.join('\n')}\n</user_profile>`
}

// ---------------- 生成生图提示词（预留） ----------------
// 用于未来的图片生成功能
export function generateUserVisualPrompt(info) {
  const blocks = buildUserBlocks(info)
  
  const visualBlocks = blocks.filter(b => b.purpose === 'visual')
  
  if (visualBlocks.length === 0) return ''
  
  const allLines = visualBlocks.flatMap(b => b.lines)
  
  return allLines.join(', ')  // 生图提示词通常用逗号分隔
}
