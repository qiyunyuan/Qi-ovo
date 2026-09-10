// src/services/Prompt/macroReplacer.js
// 提示词宏替换工具
// 职责：将提示词中的占位符（如 {{user}}、{{char}}）替换为实际值
// 使用场景：
// - 自定义板块的 prompt 文本
// - 固定板块生成的内容
// - 任何需要动态替换用户名/角色名的地方

/**
 * 替换文本中的宏占位符
 * 
 * 支持的宏：
 * - {{user}} → 用户名（来自 userInfo.name）
 * - {{char}} → 角色名（来自 charInfo.name）
 * 
 * @param {string} text - 原始文本
 * @param {Object} context - 上下文数据
 * @param {Object} context.charInfo - 角色资料
 * @param {Object} context.userInfo - 用户资料
 * @returns {string} 替换后的文本
 */
export function replaceMacros(text, context = {}) {
  if (!text || typeof text !== 'string') {
    return text
  }

  const { charInfo = {}, userInfo = {} } = context

  // 获取实际的名字，如果为空则使用默认值
  const charName = charInfo.name || 'char'
  const userName = userInfo.name || 'user'

  // 执行替换（大小写敏感）
  let result = text
  result = result.replace(/\{\{char\}\}/g, charName)
  result = result.replace(/\{\{user\}\}/g, userName)

  return result
}

/**
 * 批量替换消息数组中的宏
 * 
 * @param {Array} messages - 消息数组 [{ role, content }, ...]
 * @param {Object} context - 上下文数据
 * @returns {Array} 替换后的消息数组
 */
export function replaceMacrosInMessages(messages, context = {}) {
  if (!Array.isArray(messages)) {
    return messages
  }

  return messages.map(msg => ({
    ...msg,
    content: replaceMacros(msg.content, context)
  }))
}

/**
 * 未来可扩展的宏列表（供调试或 UI 提示使用）
 */
export const AVAILABLE_MACROS = [
  { 
    macro: '{{user}}', 
    description: '用户名称',
  },
  { 
    macro: '{{char}}', 
    description: '角色名称',
  }
  // 未来可以添加更多宏：
  // { macro: '{{time}}', description: '当前时间' },
  // { macro: '{{date}}', description: '当前日期' },
  // { macro: '{{random}}', description: '随机数' },
]
