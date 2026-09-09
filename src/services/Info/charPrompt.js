// src/services/Info/charPrompt.js
// 角色动态资料 → 提示词板块结构
// 职责：只把 char store 的原始资料，按规则转成"结构化板块"
// 注意：不负责拼装！最终拼装顺序/参数/规则由未来的 promptBuilder.js 处理

// ---------------- 板块分组定义 ----------------
export const CHAR_GROUPS = [
  { id: 'basic',      title: '角色基本信息', purpose: 'chat' },    // 对话提示词用
  { id: 'appearance', title: '外貌描写',     purpose: 'visual' },  // 生图提示词用
  { id: 'persona',    title: '性格人设',     purpose: 'chat' }     // 对话核心
]

// ---------------- 字段规则（key 对应 char store 里的字段） ----------------
// format:
//   'kv'  → 输出「label：value」
//   'raw' → 直接输出 value（适合 persona 这种长文本，不加前缀）
export const CHAR_FIELD_RULES = [
  { key: 'name',        label: '名字', group: 'basic',      format: 'kv',  enabled: true },
  { key: 'gender',      label: '性别', group: 'basic',      format: 'kv',  enabled: true },
  { key: 'birthday',    label: '生日', group: 'basic',      format: 'kv',  enabled: true },
  { key: 'nationality', label: '国籍', group: 'basic',      format: 'kv',  enabled: true },
  { key: 'region',      label: '地区', group: 'basic',      format: 'kv',  enabled: true },
  { key: 'timezone',    label: '时区', group: 'basic',      format: 'kv',  enabled: true },
  { key: 'appearance',  label: '外貌', group: 'appearance', format: 'kv',  enabled: true },
  { key: 'persona',     label: '人设', group: 'persona',    format: 'raw', enabled: true }
]

// ---------------- 核心方法：char 资料 → 板块结构 ----------------
// 入参：char store 的 info（建议调用处先 toRaw）
// 返回：[{ id, title, purpose, lines: string[] }, ...]
export function buildCharBlocks(info) {
  const linesByGroup = {}   // groupId -> string[]

  for (const rule of CHAR_FIELD_RULES) {
    if (!rule.enabled) continue
    const value = info?.[rule.key]
    if (value == null || value === '') continue   // 动态资料：空的就不进 prompt

    const line = rule.format === 'raw'
      ? String(value)
      : `${rule.label}：${value}`

    if (!linesByGroup[rule.group]) linesByGroup[rule.group] = []
    linesByGroup[rule.group].push(line)
  }

  return CHAR_GROUPS
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
// 入参：char store 的 info
// 返回：格式化的提示词字符串，如果没有数据则返回空字符串
export function generateCharPrompt(info) {
  const blocks = buildCharBlocks(info)
  
  // 只输出对话相关的 block（purpose: 'chat'）
  const chatBlocks = blocks.filter(b => b.purpose === 'chat')
  
  if (chatBlocks.length === 0) return ''
  
  // 将所有行合并（保持分组顺序：basic → persona）
  const allLines = chatBlocks.flatMap(b => b.lines)
  
  return `<character_profile>\n${allLines.join('\n')}\n</character_profile>`
}

// ---------------- 生成生图提示词（预留） ----------------
// 用于未来的图片生成功能
export function generateCharVisualPrompt(info) {
  const blocks = buildCharBlocks(info)
  
  const visualBlocks = blocks.filter(b => b.purpose === 'visual')
  
  if (visualBlocks.length === 0) return ''
  
  const allLines = visualBlocks.flatMap(b => b.lines)
  
  return allLines.join(', ')  // 生图提示词通常用逗号分隔
}
