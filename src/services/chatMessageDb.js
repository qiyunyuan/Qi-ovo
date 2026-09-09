// src/services/chatMessageDb.js
import Dexie from 'dexie'

export const chatMessageDb = new Dexie('qi_yunovo_chat_message_db')

chatMessageDb.version(1).stores({
  // 简化为只用 uid 作为会话标识（1 user = 1 char）
  messages: 'id, [uid+createdAt], uid, createdAt'
})

/**
 * 获取指定用户的所有消息
 * @param {string} uid - 用户 ID
 * @returns {Promise<Array>} 消息数组，按时间升序
 */
export async function getChatMessages(uid) {
  if (!uid) return []
  
  const messages = await chatMessageDb.messages
    .where('[uid+createdAt]')
    .between([uid, Dexie.minKey], [uid, Dexie.maxKey])
    .toArray()
  
  return messages.sort((a, b) => a.createdAt - b.createdAt)
}

/**
 * 保存单条消息
 * @param {string} uid - 用户 ID
 * @param {Object} message - 消息对象 { id, role, type, payload, createdAt, status }
 */
export async function saveChatMessage(uid, message) {
  if (!uid || !message) return
  
  const record = {
    ...message,
    uid
  }
  
  await chatMessageDb.messages.put(record)
}

/**
 * 批量保存消息
 * @param {string} uid - 用户 ID
 * @param {Array} messages - 消息数组
 */
export async function saveChatMessages(uid, messages) {
  if (!uid || !messages || messages.length === 0) return
  
  const records = messages.map(msg => ({
    ...msg,
    uid
  }))
  
  await chatMessageDb.messages.bulkPut(records)
}

/**
 * 删除指定用户的所有消息（清空会话）
 * @param {string} uid - 用户 ID
 */
export async function clearChatMessages(uid) {
  if (!uid) return
  
  const messages = await getChatMessages(uid)
  const ids = messages.map(msg => msg.id)
  
  if (ids.length > 0) {
    await chatMessageDb.messages.bulkDelete(ids)
  }
}

/**
 * 删除单条消息
 * @param {string} messageId - 消息 ID
 */
export async function deleteChatMessage(messageId) {
  if (!messageId) return
  await chatMessageDb.messages.delete(messageId)
}
