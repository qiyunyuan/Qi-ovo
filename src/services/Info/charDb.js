import Dexie from 'dexie'

export const charDb = new Dexie('qi_yunovo_char_db')

charDb.version(2).stores({
  // 1 user(uid) → 1 char
  chars: 'uid'
})

export async function getChar(uid) {
  const record = await charDb.chars.get(uid)
  return record ? record.data : null
}

export async function saveChar(uid, data) {
  const plain = typeof structuredClone === 'function'
    ? structuredClone(data)
    : JSON.parse(JSON.stringify(data))
  await charDb.chars.put({
    uid,                       // ← char 跟着账号走
    data: plain,
    updatedAt: Date.now()
  })
}
