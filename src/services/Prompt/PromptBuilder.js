// src/services/Prompt/promptBuilder.js
// 提示词构建器：根据预设配置拼接完整提示词
// 职责：
// 1. 读取启用的预设及其板块配置
// 2. 对固定动态板块（builtin），调用对应提取器生成实际内容
// 3. 按照板块的 position 和 depth 规则组装最终消息数组
// 4. 应用宏替换（{{user}}, {{char}}）

import { generateCharPrompt } from '../Info/charPrompt.js'
import { generateUserPrompt } from '../Info/userPrompt.js'
import { buildMessageFormatPrompt } from './messageFormat.js'
import { buildChatHistory, extractContext } from '../contextExtractor.js'
import { replaceMacros } from './macroReplacer.js'

/**
 * 构建完整的提示词消息数组
 * 
 * @param {Object} preset - 预设对象（包含 sections 和 params）
 * @param {Object} context - 上下文数据
 * @param {Object} context.charInfo - 角色资料（来自 char store）
 * @param {Object} context.userInfo - 用户资料（来自 profile store）
 * @param {Array} context.messages - 聊天历史消息数组（正序）
 * @param {number} context.maxRounds - 最大回合数，默认 5
 * @param {number} context.now - 当前时间戳，默认 Date.now()
 * @returns {Array} 符合 OpenAI 格式的消息数组 [{ role, content }, ...]
 */
export function buildPrompt(preset, context = {}) {
  if (!preset || !Array.isArray(preset.sections)) {
    throw new Error('Invalid preset: sections array is required')
  }

  const {
    charInfo = {},
    userInfo = {},
    messages = [],
    maxRounds = 5,
    now = Date.now()
  } = context

  // 筛选出启用的板块
  const enabledSections = preset.sections.filter(s => s.enabled)

  // 分组：sequence 板块和 depth 板块
  const sequenceSections = enabledSections.filter(s => s.position === 'sequence')
  const depthSections = enabledSections.filter(s => s.position === 'depth')

  // ── 1. 处理 sequence 板块（按顺序拼接） ──
  const sequenceMessages = []

  for (const section of sequenceSections) {
    const content = resolveSectionContent(section, {
      charInfo,
      userInfo,
      messages,
      maxRounds,
      now
    })

    // 内容为空则跳过（动态板块可能没数据）
    if (!content || content.trim() === '') continue

    sequenceMessages.push({
      role: section.role,
      content: content.trim()
    })
  }

  // ── 2. 处理 depth 板块（插入到倒数第 N 条） ──
  // depth 板块需要按 depth 值分组，然后从后往前插入
  const depthGroups = {}
  for (const section of depthSections) {
    const content = resolveSectionContent(section, {
      charInfo,
      userInfo,
      messages,
      maxRounds,
      now
    })

    if (!content || content.trim() === '') continue

    const depth = Math.max(0, Number(section.depth) || 0)
    if (!depthGroups[depth]) depthGroups[depth] = []
    depthGroups[depth].push({
      role: section.role,
      content: content.trim()
    })
  }

  // 按 depth 从小到大排序（先插入 depth=0，再插入 depth=1...）
  const sortedDepths = Object.keys(depthGroups)
    .map(Number)
    .sort((a, b) => a - b)

  // 从后往前插入
  const finalMessages = [...sequenceMessages]
  for (const depth of sortedDepths) {
    const messagesToInsert = depthGroups[depth]
    const insertIndex = Math.max(0, finalMessages.length - depth)
    finalMessages.splice(insertIndex, 0, ...messagesToInsert)
  }

  return finalMessages
}

/**
 * 解析板块内容：固定板块调用提取器，自定义板块直接返回 prompt
 * ⚠️ 所有内容都会经过宏替换处理（{{user}} → 实际用户名，{{char}} → 实际角色名）
 * 
 * @param {Object} section - 板块对象
 * @param {Object} context - 上下文数据
 * @returns {string} 板块的实际内容（已完成宏替换）
 */
function resolveSectionContent(section, context) {
  let content = ''

  // 自定义板块：直接返回 prompt
  if (!section.builtin) {
    content = section.prompt || ''
  } else {
    // 固定动态板块：根据 builtinType 调用对应提取器
    switch (section.builtinType) {
      case 'char':
        content = generateCharPrompt(context.charInfo)
        break

      case 'user':
        content = generateUserPrompt(context.userInfo)
        break

      case 'messageFormat':
        content = buildMessageFormatPrompt()
        break

      case 'chatHistory': {
        const { messages, maxRounds, now, charInfo, userInfo } = context
        const charName = charInfo?.name || 'char'
        const userName = userInfo?.name || 'user'
        
        // 👇 先截取最近的 maxRounds 回合，再进行格式化拼接
        const recentMessages = extractContext(messages, maxRounds)
        content = buildChatHistory(recentMessages, charName, userName, now)
        break
      }

      default:
        console.warn(`Unknown builtinType: ${section.builtinType}`)
        content = ''
    }
  }

  // ── 应用宏替换 ──
  // 无论是自定义板块还是固定板块，都会替换 {{user}} 和 {{char}}
  return replaceMacros(content, context)
}

/**
 * 获取预设的参数配置（用于传递给 AI API）
 * 
 * @param {Object} preset - 预设对象
 * @returns {Object} 参数对象 { temperature, topP, maxTokens, ... }
 */
export function getPresetParams(preset) {
  if (!preset || !preset.params) {
    return {
      temperature: 1,
      topP: 1,
      maxTokens: 2048,
      frequencyPenalty: 0,
      presencePenalty: 0
    }
  }

  return {
    temperature: preset.params.temperature,
    topP: preset.params.topP,
    maxTokens: preset.params.maxTokens,
    frequencyPenalty: preset.params.frequencyPenalty,
    presencePenalty: preset.params.presencePenalty
  }
}

/**
 * 调试用：生成可读的提示词预览
 * 
 * @param {Array} messages - buildPrompt() 返回的消息数组
 * @returns {string} 格式化的预览文本
 */
export function debugPrompt(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return '（无消息）'
  }

  return messages
    .map((msg, i) => {
      const roleLabel = {
        system: 'System',
        user: 'User',
        assistant: 'Assistant'
      }[msg.role] || msg.role

      const separator = '='.repeat(60)
      return `${separator}\n[消息 ${i + 1}] ${roleLabel}\n${separator}\n${msg.content}\n`
    })
    .join('\n')
}
