// src/services/aiChat.js
import { callWithPool } from './apiPool.js'
import { buildPrompt, getPresetParams } from './Prompt/PromptBuilder.js'
import { getPresets } from './Prompt/promptDb.js'
import { useCharStore } from '../stores/char.js'
import { useProfileStore } from '../stores/profile.js'

/**
 * 发送 OpenAI 兼容的聊天请求（非流式）
 * @param {string} baseURL - API 基础地址
 * @param {string} apiKey - API 密钥
 * @param {string} model - 模型名称
 * @param {Array} messages - 消息数组 [{ role, content }, ...]
 * @param {Object} params - 生成参数（temperature, topP, maxTokens 等）
 * @returns {Promise<string>} AI 回复的文本内容
 */
async function callChatApi(baseURL, apiKey, model, messages, params) {
  const url = `${baseURL.replace(/\/$/, '')}/chat/completions`
  
  const requestBody = {
    model,
    messages,
    temperature: params.temperature ?? 1,
    top_p: params.topP ?? 1,
    max_tokens: params.maxTokens ?? 2048,
    frequency_penalty: params.frequencyPenalty ?? 0,
    presence_penalty: params.presencePenalty ?? 0,
    stream: false
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`API 请求失败 (${response.status}): ${errorText || response.statusText}`)
  }

  const data = await response.json()
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('API 返回格式错误：缺少 choices 或 message 字段')
  }

  return data.choices[0].message.content || ''
}

/**
 * 解析 AI 返回的 JSON 数组格式消息
 * 
 * 预期格式：[{ t: 'text', c: '内容' }, ...]
 * - 支持 markdown 代码块包裹（```json ... ```）
 * - 如果解析成功，返回文本数组
 * - 如果解析失败，返回包含原始文本的单元素数组
 * 
 * @param {string} rawContent - AI 返回的原始内容
 * @returns {Array<string>} 文本数组，每个元素对应一个气泡
 */
function parseAiResponse(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    return []
  }

  let trimmed = rawContent.trim()
  
  // 去除 markdown 代码块标记（```json ... ``` 或 ``` ... ```）
  const codeBlockPattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/
  const match = trimmed.match(codeBlockPattern)
  
  if (match) {
    trimmed = match[1].trim()
  }
  
  // 尝试解析为 JSON 数组
  try {
    const parsed = JSON.parse(trimmed)
    
    if (!Array.isArray(parsed)) {
      console.warn('AI 返回的不是数组，使用原始文本')
      return [trimmed]
    }

    if (parsed.length === 0) {
      return []
    }

    // 提取所有元素的 c 字段，过滤空值
    const texts = parsed
      .filter(item => item && typeof item === 'object' && item.c)
      .map(item => String(item.c).trim())
      .filter(text => text.length > 0)

    if (texts.length === 0) {
      console.warn('AI 返回的数组中没有有效内容')
      return []
    }

    // 返回文本数组，每个元素对应一个气泡
    return texts

  } catch (error) {
    // JSON 解析失败，直接返回原始文本作为单个气泡
    console.warn('无法解析 AI 返回的 JSON，使用原始文本:', error.message)
    return [trimmed]
  }
}

/**
 * 获取当前启用的预设
 * @returns {Promise<Object|null>} 预设对象，如果没有启用的预设则返回 null
 */
async function getEnabledPreset() {
  const presets = await getPresets()
  const enabled = presets.find(p => p.enabled)
  
  if (!enabled) {
    throw new Error('未找到启用的预设，请在"提示词"中启用一个预设')
  }
  
  return enabled
}

/**
 * 将前端消息数组转换为提取器需要的格式
 * 
 * 前端消息格式：{ id, role, type, payload: { text }, createdAt, status }
 * 提取器需要的格式：{ role, content, timestamp }
 * 
 * @param {Array} frontendMessages - 前端消息数组
 * @returns {Array} 提取器格式的消息数组
 */
function convertMessagesToExtractorFormat(frontendMessages) {
  return frontendMessages
    .filter(msg => {
      // 只保留已发送的消息，跳过 typing/error 状态
      if (msg.status && msg.status !== 'sent') return false
      // 只保留文本消息（暂时忽略贴纸、图片等）
      if (msg.type !== 'text') return false
      return true
    })
    .map(msg => ({
      role: msg.role,
      content: msg.payload?.text || '',
      createdAt: msg.createdAt || Date.now()
    }))
}

/**
 * 生成 AI 回复（主函数）
 * 
 * 工作流程：
 * 1. 获取当前启用的预设
 * 2. 加载用户和角色资料
 * 3. 使用 PromptBuilder 拼接完整提示词
 * 4. 通过 API 池轮询调用 AI
 * 5. 解析返回的 JSON 格式回复
 * 6. 返回文本数组供前端显示为多个气泡
 * 
 * @param {Array} frontendMessages - 前端消息数组（包含 user 和 assistant 的历史消息）
 * @param {Object} options - 可选配置
 * @param {number} options.maxRounds - 最大回合数（传递给聊天历史提取器），默认 10
 * @returns {Promise<Array<string>>} AI 回复的文本数组，每个元素对应一个气泡
 */
export async function generateAiReply(frontendMessages, options = {}) {
  const { maxRounds = 10 } = options

  // 1. 获取当前启用的预设
  const preset = await getEnabledPreset()
  const params = getPresetParams(preset)

  // 2. 加载用户和角色资料
  const charStore = useCharStore()
  const profileStore = useProfileStore()

  await Promise.all([
    charStore.load(),
    profileStore.load()
  ])

  const charInfo = charStore.info || {}
  const userInfo = profileStore.info || {}

  // 3. 转换消息格式
  const messages = convertMessagesToExtractorFormat(frontendMessages)

  // 4. 使用 PromptBuilder 拼接提示词
  const promptMessages = buildPrompt(preset, {
    charInfo,
    userInfo,
    messages,
    maxRounds,
    now: Date.now()
  })

  console.log('=== 生成的提示词 ===')
  console.log(promptMessages)

  // 5. 通过 API 池调用 AI（自动重试）
  const rawContent = await callWithPool(
    callChatApi,
    [promptMessages, params],
    {
      maxRetries: 3,
      onRetry: (attempt, error, apiName) => {
        console.warn(`API ${apiName} 调用失败 (第 ${attempt} 次重试):`, error.message)
      }
    }
  )

  console.log('=== AI 原始返回 ===')
  console.log(rawContent)

  // 6. 解析 JSON 格式回复为文本数组
  const replyTexts = parseAiResponse(rawContent)

  if (replyTexts.length === 0) {
    throw new Error('AI 返回了空内容')
  }

  return replyTexts
}

/**
 * 调试用：预览当前会使用的提示词（不调用 API）
 * 
 * @param {Array} frontendMessages - 前端消息数组
 * @param {Object} options - 可选配置
 * @returns {Promise<Array>} 消息数组 [{ role, content }, ...]
 */
export async function previewPrompt(frontendMessages, options = {}) {
  const { maxRounds = 10 } = options

  const preset = await getEnabledPreset()
  
  const charStore = useCharStore()
  const profileStore = useProfileStore()

  await Promise.all([
    charStore.load(),
    profileStore.load()
  ])

  const charInfo = charStore.info || {}
  const userInfo = profileStore.info || {}
  const messages = convertMessagesToExtractorFormat(frontendMessages)

  return buildPrompt(preset, {
    charInfo,
    userInfo,
    messages,
    maxRounds,
    now: Date.now()
  })
}
