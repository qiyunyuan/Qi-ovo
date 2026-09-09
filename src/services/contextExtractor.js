/**
 * 消息上下文提取器
 *
 * 负责两件事：
 * 1. extractContext()   → 提取最近 N 回合的原始消息数组（给 AI 发送用）
 * 2. buildChatHistory() → 将消息数组格式化为 <chat_history> 字符串（拼入 prompt 用）
 *
 * 回合划分规则：
 * - 角色切换（user ↔ assistant）→ 新回合
 * - 同一角色，两条消息时间间隔 > 15 分钟 → 新回合
 */

// 回合时间间隔阈值：15 分钟
const ROUND_TIME_THRESHOLD = 15 * 60 * 1000

// 历史消息中，两回合之间超过多久才插入 [System: X后] 标记：1 小时
const SYSTEM_MARKER_THRESHOLD = 60 * 60 * 1000

// ─────────────────────────────────────────────
// 内部工具函数
// ─────────────────────────────────────────────

/**
 * 将消息数组从后往前划分回合，返回正序的回合数组
 * 每个回合：{ role, messages: [...], firstTime, lastTime }
 * @param {Array} messages
 * @returns {Array}
 */
function splitIntoRounds(messages) {
  const rounds = []
  let currentRound = null

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]

    if (!msg || !msg.role || !Number.isFinite(Number(msg.createdAt))) {
      continue
    }

    const msgTime = Number(msg.createdAt)

    if (!currentRound) {
      currentRound = {
        role: msg.role,
        messages: [msg],
        firstTime: msgTime,
        lastTime: msgTime
      }
      continue
    }

    // 当前回合最早那条消息的时间（从后往前累积，所以 messages 末尾是最早的）
    const currentRoundEarliestTime = Number(currentRound.messages[currentRound.messages.length - 1].createdAt)

    const shouldStartNewRound =
      // 规则1：角色不同
      msg.role !== currentRound.role ||
      // 规则2：同一角色但间隔超过阈值
      (msg.role === currentRound.role &&
        currentRoundEarliestTime - msgTime > ROUND_TIME_THRESHOLD)

    if (shouldStartNewRound) {
      rounds.push(currentRound)
      currentRound = {
        role: msg.role,
        messages: [msg],
        firstTime: msgTime,
        lastTime: msgTime
      }
    } else {
      currentRound.messages.push(msg)
      currentRound.firstTime = msgTime // 往前延伸，更新最早时间
    }
  }

  if (currentRound) {
    rounds.push(currentRound)
  }

  // 从后往前收集，所以现在是倒序，反转回正序
  rounds.reverse()

  // 每个 round 内部的 messages 也是倒序收集的，一并反转
  for (const round of rounds) {
    round.messages.reverse()
  }

  return rounds
}

/**
 * 将毫秒时间戳格式化为 "YYYY年MM月DD日"
 * @param {number} ts
 * @returns {string}
 */
function formatDate(ts) {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}年${m}月${day}日`
}

/**
 * 将毫秒时间戳格式化为 "HH:mm"
 * @param {number} ts
 * @returns {string}
 */
function formatTime(ts) {
  const d = new Date(ts)
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

/**
 * 将毫秒时间戳格式化为 "YYYY年MM月DD日 HH:mm"
 * @param {number} ts
 * @returns {string}
 */
function formatDateTime(ts) {
  return `${formatDate(ts)} ${formatTime(ts)}`
}

/**
 * 将毫秒差值转换为友好的中文描述，如 "3分钟"、"2小时"、"1天"
 * @param {number} diffMs
 * @returns {string}
 */
function formatDiff(diffMs) {
  const minutes = Math.round(diffMs / (1000 * 60))
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  const hours = Math.round(diffMs / (1000 * 60 * 60))
  if (hours < 24) {
    return `${hours}小时`
  }
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return `${days}天`
}

// ─────────────────────────────────────────────
// 对外导出：核心逻辑
// ─────────────────────────────────────────────

/**
 * 提取最近 N 回合的原始消息数组
 * 返回值保持原始消息对象，可直接用于后续 prompt 拼接
 *
 * @param {Array} messages  - 完整消息数组，按时间正序排列
 * @param {number} maxRounds - 最大回合数，默认 5
 * @returns {Array} 提取后的消息数组（正序）
 */
export function extractContext(messages, maxRounds = 5) {
  if (!Array.isArray(messages) || messages.length === 0) return []

  const rounds = splitIntoRounds(messages)

  // 取最近 N 回合（正序末尾）
  const selected = rounds.slice(-maxRounds)

  // 展平回消息数组
  return selected.flatMap(r => r.messages)
}

/**
 * 将消息数组格式化为 prompt 用的 <chat_history> 字符串
 *
 * 格式示例：
 * <chat_history>
 * [2024年08月30日]
 * [09:00] user: 早上好
 * [09:02] char: 你好！
 *
 * [System: 过了3小时]
 *
 * [12:15] user: 我回来了
 * [12:16] char: 欢迎回来~
 * </chat_history>
 *
 * <current_status>
 * 当前时间：2024年08月30日 18:30
 * 距离上一条消息已过去：6小时
 * </current_status>
 *
 * @param {Array}  messages    - 原始消息数组（正序），通常是 extractContext() 的返回值
 * @param {string} charName    - char 的显示名称，替换 'assistant' 标签
 * @param {string} userName    - user 的显示名称，替换 'user' 标签
 * @param {number} [now]       - 当前时间戳，默认 Date.now()（方便测试时注入）
 * @returns {string}
 */
export function buildChatHistory(messages, charName = 'char', userName = 'user', now = Date.now()) {
  if (!Array.isArray(messages) || messages.length === 0) return ''

  const rounds = splitIntoRounds(messages)

  if (rounds.length === 0) return ''

  const lines = []
  let lastDate = ''
  let lastRoundEndTime = null

  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i]

    // 两回合之间时间差超过阈值，插入 System 标记
    if (lastRoundEndTime !== null) {
      const gap = round.firstTime - lastRoundEndTime
      if (gap > SYSTEM_MARKER_THRESHOLD) {
        lines.push('')
        lines.push(`[System: 过了${formatDiff(gap)}]`)
        lines.push('')
      }
    }

    // 遍历回合内每条消息
    for (const msg of round.messages) {
      const msgTime = Number(msg.createdAt)
      const dateStr = formatDate(msgTime)

      // 日期变更时插入日期行
      if (dateStr !== lastDate) {
        lines.push(`[${dateStr}]`)
        lastDate = dateStr
      }

      const timeStr = formatTime(msgTime)
      const speaker = msg.role === 'assistant' ? charName : userName
      lines.push(`[${timeStr}] ${speaker}: ${msg.content}`)
    }

    lastRoundEndTime = round.lastTime
  }

  // 拼接 <chat_history>
  let result = `<chat_history>\n${lines.join('\n')}\n</chat_history>`

  // 拼接 <current_status>
  const statusLines = [`当前时间：${formatDateTime(now)}`]

  if (lastRoundEndTime !== null) {
    const diffSinceLast = now - lastRoundEndTime
    // 只有超过 1 分钟才有意义提示
    if (diffSinceLast > 60 * 1000) {
      statusLines.push(`距离上一条消息已过去：${formatDiff(diffSinceLast)}`)
    }
  }

  result += `\n\n<current_status>\n${statusLines.join('\n')}\n</current_status>`

  return result
}

// ─────────────────────────────────────────────
// 调试用
// ─────────────────────────────────────────────

/**
 * 调试用：返回回合划分详情
 * @param {Array} messages
 * @returns {Array} 每个回合的摘要信息
 */
export function debugRounds(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return []

  return splitIntoRounds(messages).map((round, i) => ({
    index: i + 1,
    role: round.role,
    count: round.messages.length,
    startTime: round.firstTime,
    endTime: round.lastTime,
    startTimeStr: formatDateTime(round.firstTime),
    endTimeStr: formatDateTime(round.lastTime)
  }))
}
