<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCharStore } from '../../stores/char'
import PhoneFrame from '../../components/PhoneFrame.vue'

const router = useRouter()
const store = useCharStore()

const info = ref(null)        // 本地编辑副本，点保存才写回 store
const savedTip = ref(false)
const genderOptions = ['', '女', '男', '保密']

// ── 弹窗状态 ──
const showPicker = ref(false)
const pickerView = ref('menu')    // menu | link | library
const linkInput = ref('')
const fileInput = ref(null)

// ── 头像库：自动读取 public/avatar/index.json ──
const libraryAvatars = ref([])
const DEFAULT_LIBRARY = [
  '/avatar/avatar-1.png',
  '/avatar/avatar-2.png',
  '/avatar/avatar-3.png',
  '/avatar/avatar-4.png',
  '/avatar/avatar-5.png',
  '/avatar/avatar-6.png',
  '/avatar/avatar-7.png',
  '/avatar/avatar-8.png'
]

// 年龄由生日自动计算
const age = computed(() => {
  if (!info.value?.birthday) return '--'
  const birth = new Date(info.value.birthday)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
})

// ── 头像预览：Blob 转 objectURL，字符串/路径直接用 ──
let objectUrl = null
const avatarSrc = ref('')

function refreshAvatar() {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = null
  }
  const av = info.value?.avatar
  if (!av) {
    avatarSrc.value = ''
    return
  }
  if (av instanceof Blob) {
    objectUrl = URL.createObjectURL(av)
    avatarSrc.value = objectUrl
  } else if (typeof av === 'string' && /^(https?:\/\/|\/|data:)/i.test(av)) {
    avatarSrc.value = av
  } else {
    avatarSrc.value = ''   // 兼容旧数据里的 emoji，不再显示
  }
}

// ── 自动读取头像库清单 ──
async function loadLibrary() {
  try {
    const res = await fetch('/avatar/index.json', { cache: 'no-store' })
    if (res.ok) {
      const list = await res.json()
      const files = Array.isArray(list) ? list : (list.files || [])
      const urls = files
        .filter(f => /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(f))
        .map(f => (f.startsWith('/') ? f : `/avatar/${f}`))
      libraryAvatars.value = [...new Set(urls)]
      return
    }
  } catch (e) {
    /* 清单不存在时走兜底 */
  }
  libraryAvatars.value = [...DEFAULT_LIBRARY]
}

onMounted(async () => {
  const data = await store.load()
  info.value = { ...data }
  refreshAvatar()
  await loadLibrary()
})

onUnmounted(() => {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
})

// ── 弹窗控制 ──
function openPicker() {
  pickerView.value = 'menu'
  showPicker.value = true
}

function closePicker() {
  showPicker.value = false
}

// ── 本地上传：File 本身就是 Blob，原生二进制存入 ──
function onFileChange(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    e.target.value = ''
    return
  }
  info.value.avatar = file
  refreshAvatar()
  closePicker()
  e.target.value = ''
}

// ── 链接上传 ──
function confirmLink() {
  const url = linkInput.value.trim()
  if (!url) { alert('请输入图片链接'); return }
  if (!/^https?:\/\//i.test(url)) { alert('请输入 http(s):// 开头的图片链接'); return }
  info.value.avatar = url
  refreshAvatar()
  linkInput.value = ''
  closePicker()
}

// ── 头像库选择 ──
function pickAvatar(url) {
  info.value.avatar = url
  refreshAvatar()
  closePicker()
}

async function save() {
  if (!info.value) return
  await store.save(info.value)
  savedTip.value = true
  setTimeout(() => router.push('/info-app'), 600)
}

function goBack() {
  router.push('/info-app')
}
</script>

<template>
  <PhoneFrame>
    <div class="info-page">
      <div class="page-header">
        <div class="header-btn" @click="goBack">‹</div>
        <div class="header-title">TA的信息</div>
        <div class="header-btn"></div>
      </div>

      <div class="info-body" v-if="info">
        <div class="avatar-card">
          <div class="avatar" @click="openPicker">
            <img v-if="avatarSrc" :src="avatarSrc" class="avatar-img" alt="头像" />
            <svg v-else class="avatar-placeholder" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" fill="#c9a0af"/>
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="#c9a0af"/>
            </svg>
          </div>
          <div class="avatar-hint">点击头像更换</div>
        </div>

        <div class="form-card">
          <div class="form-row">
            <label>名字</label>
            <input v-model="info.name" placeholder="填写 TA 的名字" />
          </div>
          <div class="form-row">
            <label>性别</label>
            <select v-model="info.gender">
              <option v-for="g in genderOptions" :key="g" :value="g">
                {{ g || '未填写' }}
              </option>
            </select>
          </div>
          <div class="form-row">
            <label>生日</label>
            <input type="date" v-model="info.birthday" />
          </div>
          <div class="form-row">
            <label>年龄</label>
            <span class="age-text">{{ age }}</span>
          </div>
          <div class="form-row">
            <label>国籍</label>
            <input v-model="info.nationality" placeholder="如：中国" />
          </div>
          <div class="form-row">
            <label>地区</label>
            <input v-model="info.region" placeholder="如：上海" />
          </div>
          <div class="form-row">
            <label>时区</label>
            <input v-model="info.timezone" placeholder="如：GMT+8" />
          </div>
          <div class="form-row">
            <label>生图外观</label>
            <textarea
              v-model="info.appearance"
              rows="3"
              placeholder="描述角色外观，用于 AI 生图"
            ></textarea>
          </div>
          <div class="form-row last">
            <label>人设</label>
            <textarea
              v-model="info.persona"
              rows="4"
              placeholder="性格、背景、说话风格、喜好……让 TA 更立体"
            ></textarea>
          </div>
        </div>

        <div v-if="savedTip" class="save-tip">✓ 已保存</div>
        <div class="edit-btn" @click="save">保存</div>
      </div>
    </div>

    <!-- 隐藏的文件选择，由弹窗"本地上传"触发 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden-file"
      @change="onFileChange"
    />

    <!-- 头像选择弹窗 -->
    <div v-if="showPicker" class="picker-mask" @click.self="closePicker">
      <div class="picker-pop">
        <div class="picker-header">
          <span class="picker-title">选择头像</span>
          <span class="picker-close" @click="closePicker">×</span>
        </div>

        <div v-if="pickerView === 'menu'" class="picker-menu">
          <div class="picker-option" @click="fileInput.click()">
            <span class="opt-icon">📁</span>
            <span class="opt-text">本地上传<em>从设备选择图片（Blob 二进制存储）</em></span>
          </div>
          <div class="picker-option" @click="pickerView = 'link'">
            <span class="opt-icon">🔗</span>
            <span class="opt-text">链接上传<em>粘贴一张图片的 HTTP 链接</em></span>
          </div>
          <div class="picker-option" @click="pickerView = 'library'">
            <span class="opt-icon">🎨</span>
            <span class="opt-text">头像库<em>从 public/avatar 选择</em></span>
          </div>
        </div>

        <div v-else-if="pickerView === 'link'" class="picker-panel">
          <div class="panel-title">链接上传</div>
          <input
            v-model="linkInput"
            class="link-input"
            placeholder="https://..."
            @keyup.enter="confirmLink"
          />
          <div class="panel-actions">
            <span class="picker-back" @click="pickerView = 'menu'">‹ 返回</span>
            <button class="panel-confirm" @click="confirmLink">确认</button>
          </div>
        </div>

        <div v-else class="picker-panel">
          <div class="panel-title">头像库</div>
          <div class="lib-wrap">
            <div v-if="libraryAvatars.length" class="lib-grid">
              <img
                v-for="a in libraryAvatars"
                :key="a"
                :src="a"
                class="lib-item"
                :class="{ active: info.avatar === a }"
                @click="pickAvatar(a)"
                alt="头像"
              />
            </div>
            <div v-else class="lib-empty">头像库是空的，请把图片放到 public/avatar/</div>
          </div>
          <div class="panel-actions">
            <span class="picker-back" @click="pickerView = 'menu'">‹ 返回</span>
          </div>
        </div>
      </div>
    </div>
  </PhoneFrame>
</template>

<style scoped>
.info-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff0f5;
}

.page-header {
  height: 60px;
  background-color: #ffb7d2;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  font-weight: bold;
  flex-shrink: 0;
}

.header-btn {
  width: 40px;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  user-select: none;
}

.header-title {
  font-size: 16px;
}

.info-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.avatar-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px 16px 16px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(255, 92, 138, 0.08);
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #ffe0ec;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 0 0 3px transparent;
  transition: box-shadow 0.2s;
}

.avatar:hover {
  box-shadow: 0 0 0 3px #ffb7d2;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
}

.avatar-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #c9a0af;
}

.form-card {
  margin-top: 16px;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(255, 92, 138, 0.06);
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #fff0f5;
}

.form-row.last {
  border-bottom: none;
  align-items: flex-start;
}

.form-row label {
  width: 64px;
  flex-shrink: 0;
  color: #a88895;
  font-size: 14px;
}

.form-row input,
.form-row select {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #5c3a48;
  background: transparent;
  font-family: inherit;
}

.form-row textarea {
  flex: 1;
  border: 1px solid #ffe0ec;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  color: #5c3a48;
  outline: none;
  resize: vertical;
  background: #fffafc;
  font-family: inherit;
  line-height: 1.5;
}

.age-text {
  color: #5c3a48;
  font-size: 14px;
}

.save-tip {
  margin-top: 14px;
  text-align: center;
  color: #ff5c8a;
  font-size: 14px;
  font-weight: 500;
}

.edit-btn {
  margin-top: 14px;
  height: 44px;
  background: #ff5c8a;
  color: #ffffff;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 92, 138, 0.3);
}

.hidden-file {
  display: none;
}

/* ── 弹窗 ── */
.picker-mask {
  position: fixed;
  inset: 0;
  background: rgba(92, 58, 72, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.picker-pop {
  width: 300px;
  max-width: 86vw;
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 30px rgba(92, 58, 72, 0.25);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.picker-title {
  font-size: 15px;
  font-weight: bold;
  color: #5c3a48;
}

.picker-close {
  font-size: 22px;
  color: #c9a0af;
  cursor: pointer;
  line-height: 1;
}

.picker-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fff0f5;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.picker-option:last-child {
  margin-bottom: 0;
}

.picker-option:hover {
  background: #ffe0ec;
}

.opt-icon {
  font-size: 20px;
}

.opt-text {
  color: #5c3a48;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.opt-text em {
  font-style: normal;
  font-weight: normal;
  font-size: 12px;
  color: #c9a0af;
}

.picker-panel .panel-title {
  font-size: 14px;
  font-weight: bold;
  color: #5c3a48;
  margin-bottom: 10px;
}

.link-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #ffe0ec;
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 13px;
  color: #5c3a48;
  outline: none;
  background: #fffafc;
  font-family: inherit;
}

.link-input:focus {
  border-color: #ffb7d2;
}

.panel-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.picker-back {
  font-size: 13px;
  color: #a88895;
  cursor: pointer;
  user-select: none;
}

.panel-confirm {
  border: none;
  background: #ff5c8a;
  color: #ffffff;
  border-radius: 16px;
  padding: 7px 20px;
  font-size: 13px;
  cursor: pointer;
}

.lib-wrap {
  max-height: 240px;
  overflow-y: auto;
}

.lib-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.lib-item {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 10px;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid transparent;
  background: #fff0f5;
}

.lib-item.active {
  border-color: #ff5c8a;
}

.lib-empty {
  text-align: center;
  color: #c9a0af;
  font-size: 13px;
  padding: 20px 0;
}
</style>
