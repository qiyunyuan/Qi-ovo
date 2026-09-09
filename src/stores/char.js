// src/stores/char.js
import { defineStore } from 'pinia'
import { ref, toRaw } from 'vue'
import { getChar, saveChar } from '../services/Info/charDb'

const DEFAULT_CHAR = {
  avatar: '',
  name: '',
  gender: '',
  birthday: '',
  nationality: '',
  region: '',
  timezone: '',
  appearance: '',
  persona: ''
}

const CURRENT_UID_KEY = 'qi_yunovo_current_uid'   // 与 profile 共用

export const useCharStore = defineStore('char', () => {
  const info = ref(null)
  const loaded = ref(false)

  async function load(uid) {
    const targetUid = uid || localStorage.getItem(CURRENT_UID_KEY) || ''
    if (loaded.value && targetUid === currentUid()) return info.value

    const data = targetUid ? await getChar(targetUid) : null
    info.value = { ...DEFAULT_CHAR, ...(data || {}) }
    loaded.value = true
    return info.value
  }

  async function save(patch) {
    info.value = { ...(info.value || DEFAULT_CHAR), ...patch }
    const uid = localStorage.getItem(CURRENT_UID_KEY) || ''
    await saveChar(uid, toRaw(info.value))
    return info.value
  }

  // 跟随 profile 一起切换
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
