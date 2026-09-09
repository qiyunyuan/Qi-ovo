import Dexie from 'dexie'

export const profileDb = new Dexie('qi_yunovo_profile_db')

// 开发阶段没有旧数据：直接升 version，按 uid 存多个账号
// （若之前跑过旧库，浏览器控制台执行 indexedDB.deleteDatabase('qi_yunovo_profile_db') 清掉即可）
profileDb.version(2).stores({
  profile: 'uid'   // ← 主键 = 系统 uid
})

export async function getProfile(uid) {
  const record = await profileDb.profile.get(uid)
  return record ? record.data : null
}

export async function saveProfile(uid, data) {
  const plain = typeof structuredClone === 'function'
    ? structuredClone(data)
    : JSON.parse(JSON.stringify(data))
  await profileDb.profile.put({
    uid,                       // ← 主键
    data: plain,
    updatedAt: Date.now()
  })
}
