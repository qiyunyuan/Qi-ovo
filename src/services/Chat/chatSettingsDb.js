import Dexie from 'dexie'

export const chatSettingsDb = new Dexie('qi_yunovo_chat_settings_db')

chatSettingsDb.version(1).stores({
  // 1 user(uid) → 1 chatSettings
  settings: 'uid'
})

export async function getChatSettings(uid) {
  const record = await chatSettingsDb.settings.get(uid)
  return record ? record.data : null
}

export async function saveChatSettings(uid, data) {
  const plain = typeof structuredClone === 'function'
    ? structuredClone(data)
    : JSON.parse(JSON.stringify(data))
  await chatSettingsDb.settings.put({
    uid,
    data: plain,
    updatedAt: Date.now()
  })
}
