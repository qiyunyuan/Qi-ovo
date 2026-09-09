// src/services/Prompt/messageFormat.js
// 消息格式板块：指示 AI 以 JSON 数组格式输出回复
// 每个元素包含 t（type 类型）和 c（content 内容）两个字段
// 前端解析该数组后可按类型做不同渲染（气泡、旁白、动作等）
//
// ── 目前只启用了 text 类型，后续如需扩展（narration / inner / action 等），
//    在 typeDescriptions 里追加即可，prompt 会自动拼接。

// ── 类型注册表 ──
// key   = 传给 AI 的 t 值
// label = 给人看的中文说明（仅注释用，不会出现在 prompt 里）
// desc  = 写进 prompt 的单行规则描述
const typeDescriptions = {
  text: {
    label: '对话正文',
    desc: 'text：角色的对话内容'
  }
  // ── 以后要加新类型，照着上面的格式往下写就行 ──
  // narration: {
  //   label: '旁白/场景描写',
  //   desc: 'narration：旁白或场景描写'
  // },
  // inner: {
  //   label: '角色内心独白',
  //   desc: 'inner：角色的内心独白'
  // },
  // action: {
  //   label: '角色动作/表情',
  //   desc: 'action：角色的动作或表情描写'
  // },
}

// ── 已启用的类型（控制哪些类型会写进 prompt） ──
// 如果以后开放了新类型，把 key 加进这个数组就会自动生效
const enabledTypes = ['text']

/**
 * 生成消息格式提示词
 * @returns {string} 直接拼进 system prompt 的纯文本
 */
export function buildMessageFormatPrompt() {
  // 筛选出启用的类型描述行
  const typeLines = enabledTypes
    .filter(key => typeDescriptions[key])
    .map(key => `- ${typeDescriptions[key].desc}`)
    .join('\n')

  // ── prompt 正文 ──
  // 每一行都有对应注释说明意图，方便你调整措辞或增减规则
  const lines = [
    // 总规则：强制 JSON 数组输出
    '你的每次回复必须是 JSON 数组，不要输出任何数组以外的内容。',
    // 元素结构说明
    '数组中每个元素包含两个字段：t 表示类型，c 表示内容。',
    // 列出当前可用的类型
    '可用的类型：',
    typeLines,
    // 格式兜底：确保 AI 不会自作主张加字段或改结构
    '不要添加上述以外的字段或类型。'
  ]

  return lines.join('\n')
}
