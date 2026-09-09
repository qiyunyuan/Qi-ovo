// src/stores/profile.js
import { defineStore } from 'pinia'
import { ref, toRaw } from 'vue'
import { getProfile, saveProfile } from '../services/Info/profileDb'

const DEFAULT_PROFILE = {
  uid: '',         // 系统生成，不可改 —— 真正的主键（后台字段）
  avatar: '',
  name: '',
  id: '',          // 用户可填写/修改 —— 微信式 ID，切换界面展示用
  gender: '',
  birthday: '',
  nationality: '',
  region: '',
  timezone: '',
  appearance: ''
}

const CURRENT_UID_KEY = 'qi_yunovo_current_uid'

export const useProfileStore = defineStore('profile', () => {
  const info = ref(null)
  const loaded = ref(false)

  // 当前账号 uid：优先 localStorage，没有就新建一个账号
  async function load(uid) {
    if (loaded.value && (!uid || uid === currentUid())) return info.value

    const targetUid = uid || currentUid()
    const data = targetUid ? await getProfile(targetUid) : null

    // 已有账号：读取；没有：生成新 uid 并立刻落库
    if (data) {
      info.value = { ...DEFAULT_PROFILE, ...data }
    } else {
      info.value = { ...DEFAULT_PROFILE, uid: createUid() }
      await saveProfile(info.value.uid, toRaw(info.value))
    }
    localStorage.setItem(CURRENT_UID_KEY, info.value.uid)
    loaded.value = true
    return info.value
  }

  // 保存：uid 永远以现有值为准，patch 改不掉它
  async function save(patch) {
    const current = info.value || DEFAULT_PROFILE
    info.value = {
      ...current,
      ...patch,
      uid: current.uid   // ← 强制保留系统 uid
    }
    await saveProfile(info.value.uid, toRaw(info.value))
    return info.value
  }

  // 切换账号：换 uid，清内存，下次 load 读新账号
  function switchUser(uid) {
    localStorage.setItem(CURRENT_UID_KEY, uid)
    loaded.value = false
    info.value = null
  }

  return { info, loaded, load, save, switchUser }
})

function currentUid() {
  return localStorage.getItem(CURRENT_UID_KEY) || ''
}

function createUid() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}
