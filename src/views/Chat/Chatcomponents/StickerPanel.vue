<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import * as mammoth from 'mammoth/mammoth.browser'
import {
  addSticker,
  bulkAddStickers,
  deleteStickers,
  getAllStickerCategories,
  getAllStickers,
  getStickerImageUrl,
  saveStickerCategories,
  updateSticker
} from '../../../services/stickerDb'

const emit = defineEmits(['send-sticker'])
const props = defineProps({
  matchKeyword: {
    type: String,
    default: ''
  }
})


const visible = defineModel('visible', {
  type: Boolean,
  default: false
})

const currentView = ref('main') // main | import

const keyword = ref('')
const activeCategory = ref('默认')
const newCategoryName = ref('')

const localStickerText = ref('')
const localStickerUrl = ref('')
const localStickerFile = ref(null)

const urlStickerText = ref('')
const urlStickerUrl = ref('')

const batchText = ref('')

const manageMode = ref(false)
const selectedIds = ref([])
const moveTarget = ref('默认')

const longPressTimer = ref(null)

const dialogVisible = ref(false)
const dialogType = ref('') // add-category | category-menu | rename-category | delete-category | tip
const dialogTitle = ref('')
const dialogMessage = ref('')
const dialogInput = ref('')
const dialogTarget = ref('')

const categories = ref(['默认'])

const editStickerForm = ref({
  text: '',
  meaning: '',
  description: ''
})


const MAX_LOCAL_STICKER_SIZE = 2 * 1024 * 1024
const previewUrlMap = new Map()

onMounted(async () => {
  await loadData()
})

watch(categories, () => {
  saveStickerCategories(categories.value)
}, { deep: true })

watch(visible, isVisible => {
  if (!isVisible) {
    resetManageState()
  }
})

function getDisplayUrl(item) {
  if (item.source === 'local') {
    if (!previewUrlMap.has(item.id)) {
      previewUrlMap.set(item.id, getStickerImageUrl(item))
    }

    return previewUrlMap.get(item.id)
  }

  return item.url
}


const stickers = ref([])

const filteredStickers = computed(() => {
  const key = (keyword.value.trim() || props.matchKeyword.trim())

  return stickers.value.filter(item => {
    const matchCategory =
      activeCategory.value === '全部' || item.category === activeCategory.value

    const searchText = [
      item.text,
      item.description,
      item.meaning
    ].filter(Boolean).join(' ')

    const matchKeyword = !key || searchText.includes(key)

    return matchCategory && matchKeyword
  })
})

const isAllSelected = computed(() => {
  return (
    filteredStickers.value.length > 0 &&
    filteredStickers.value.every(item => selectedIds.value.includes(item.id))
  )
})

function createId() {
  return `sticker_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

async function loadData() {
  const savedCategories = await getAllStickerCategories()
  const savedStickers = await getAllStickers()

  categories.value = savedCategories.length ? savedCategories : ['默认']

  if (!categories.value.includes('默认')) {
    categories.value.unshift('默认')
  }

  stickers.value = savedStickers
}

function isGif(file) {
  return file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片读取失败'))
    }

    image.src = url
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise(resolve => {
    canvas.toBlob(resolve, type, quality)
  })
}

async function compressImageToMaxSize(file, maxSize) {
  if (file.size <= maxSize) return file

  if (isGif(file)) {
    throw new Error('GIF 动图超过 2MB 时不能压缩，请换小一点的 GIF')
  }

  const image = await loadImageFromFile(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  let width = image.naturalWidth
  let height = image.naturalHeight
  let quality = 0.9
  let blob = file

  while (blob.size > maxSize && (quality > 0.45 || width > 360)) {
    if (quality <= 0.45) {
      width = Math.round(width * 0.85)
      height = Math.round(height * 0.85)
      quality = 0.9
    }

    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(image, 0, 0, width, height)

    blob = await canvasToBlob(canvas, 'image/jpeg', quality)

    if (!blob) {
      throw new Error('图片压缩失败')
    }

    quality -= 0.08
  }

  if (blob.size > maxSize) {
    throw new Error('图片压缩后仍超过 2MB，请换一张更小的图片')
  }

  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
    type: 'image/jpeg'
  })
}

function getCurrentCategory() {
  return activeCategory.value === '全部' ? '默认' : activeCategory.value
}

function openDialog(type, options = {}) {
  dialogType.value = type
  dialogTitle.value = options.title || ''
  dialogMessage.value = options.message || ''
  dialogInput.value = options.input || ''
  dialogTarget.value = options.target || ''
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
  dialogType.value = ''
  dialogTitle.value = ''
  dialogMessage.value = ''
  dialogInput.value = ''
  dialogTarget.value = ''
  editStickerForm.value = {
    text: '',
    meaning: '',
    description: ''
  }
}

function showTip(message, title = '提示') {
  openDialog('tip', {
    title,
    message
  })
}

function addCategory() {
  openDialog('add-category', {
    title: '新建分组',
    message: '给新的表情包分组取个名字吧',
    input: '',
    target: ''
  })
}

function confirmAddCategory() {
  const finalName = dialogInput.value.trim()

  if (!finalName) {
    showTip('请输入分组名称')
    return
  }

  if (categories.value.includes(finalName)) {
    showTip('该分组已存在')
    return
  }

  categories.value.push(finalName)
  activeCategory.value = finalName
  moveTarget.value = finalName

  closeDialog()
}

function startCategoryLongPress(category) {
  clearCategoryLongPress()

  longPressTimer.value = setTimeout(() => {
    openCategoryMenu(category)
  }, 650)
}

function clearCategoryLongPress() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

function openCategoryMenu(category) {
  openDialog('category-menu', {
    title: `管理分组`,
    message:
      category === '默认'
        ? `「${category}」是默认分组，不能删除，但可以重命名。`
        : `你想对「${category}」做什么？`,
    target: category
  })
}

function openRenameCategoryDialog(category) {
  openDialog('rename-category', {
    title: '重命名分组',
    message: `请输入「${category}」的新名称`,
    input: category,
    target: category
  })
}

function confirmRenameCategory() {
  const oldName = dialogTarget.value
  const newName = dialogInput.value.trim()

  if (!newName || newName === oldName) {
    closeDialog()
    return
  }

  if (categories.value.includes(newName)) {
    showTip('该分组已存在')
    return
  }

  categories.value = categories.value.map(item =>
    item === oldName ? newName : item
  )

  stickers.value = stickers.value.map(item => {
    if (item.category !== oldName) return item

    return {
      ...item,
      category: newName
    }
  })

  if (activeCategory.value === oldName) {
    activeCategory.value = newName
  }

  if (moveTarget.value === oldName) {
    moveTarget.value = newName
  }

  closeDialog()
}

function openDeleteCategoryDialog(category) {
  if (category === '默认') {
    showTip('默认分组不能删除')
    return
  }

  openDialog('delete-category', {
    title: '删除分组',
    message: `确定删除「${category}」吗？该分组下的表情包会移动到默认分组。`,
    target: category
  })
}

function openEditStickerDialog(item) {
  editStickerForm.value = {
    text: item.text || '',
    meaning: item.meaning || '',
    description: item.description || ''
  }

  openDialog('edit-sticker', {
    title: '修改表情包',
    message: '可修改表情包文字、含义和描述',
    target: item.id
  })
}

async function confirmEditSticker() {
  const id = dialogTarget.value
  const text = editStickerForm.value.text.trim()
  const meaning = editStickerForm.value.meaning.trim()
  const description = editStickerForm.value.description.trim()

  if (!id) return
  if (!text) {
    showTip('请输入表情包文字')
    return
  }

  await updateSticker(id, {
    text,
    meaning,
    description
  })

  stickers.value = stickers.value.map(item => {
    if (item.id !== id) return item

    return {
      ...item,
      text,
      meaning,
      description
    }
  })

  closeDialog()
}

function confirmDeleteCategory() {
  const category = dialogTarget.value

  if (category === '默认') {
    showTip('默认分组不能删除')
    return
  }

  categories.value = categories.value.filter(item => item !== category)

  stickers.value = stickers.value.map(item => {
    if (item.category !== category) return item

    return {
      ...item,
      category: '默认'
    }
  })

  if (activeCategory.value === category) {
    activeCategory.value = '默认'
  }

  if (moveTarget.value === category) {
    moveTarget.value = '默认'
  }

  closeDialog()
}

async function handleLocalFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    showTip('请选择图片文件')
    event.target.value = ''
    return
  }

  try {
    const finalFile = await compressImageToMaxSize(file, MAX_LOCAL_STICKER_SIZE)

    localStickerFile.value = finalFile

    if (localStickerUrl.value) {
      URL.revokeObjectURL(localStickerUrl.value)
    }

    localStickerUrl.value = URL.createObjectURL(finalFile)
  } catch (error) {
    showTip(error.message || '图片处理失败')
    localStickerFile.value = null
    localStickerUrl.value = ''
    event.target.value = ''
  }
}

async function addLocalSticker() {
  const text = localStickerText.value.trim()

  if (!text || !localStickerFile.value) {
    showTip('请先选择本地图片并填写表情包文字')
    return
  }

const sticker = {
  id: createId(),
  category: getCurrentCategory(),
  text,
  meaning: '',
  description: '',
  source: 'local',
  blob: localStickerFile.value,
  mimeType: localStickerFile.value.type,
  size: localStickerFile.value.size
}

  await addSticker(sticker)
  stickers.value.unshift(sticker)

  localStickerText.value = ''

  if (localStickerUrl.value) {
    URL.revokeObjectURL(localStickerUrl.value)
  }

  localStickerUrl.value = ''
  localStickerFile.value = null
  currentView.value = 'main'
}

async function addUrlSticker() {
  const text = urlStickerText.value.trim()
  const url = urlStickerUrl.value.trim()

  if (!text || !url) {
    showTip('请填写表情包文字和图片 URL')
    return
  }

const sticker = {
  id: createId(),
  category: getCurrentCategory(),
  text,
  meaning: '',
  description: '',
  url,
  source: 'url'
}

  await addSticker(sticker)
  stickers.value.unshift(sticker)

  urlStickerText.value = ''
  urlStickerUrl.value = ''
  currentView.value = 'main'
}

function sendSticker(item) {
  if (manageMode.value) {
    toggleSelect(item.id)
    return
  }

  emit('send-sticker', {
    id: item.id
  })

  visible.value = false
}

function toggleSelect(id) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(item => item !== id)
  } else {
    selectedIds.value.push(id)
  }
}

function toggleSelectAll() {
  const ids = filteredStickers.value.map(item => item.id)

  if (isAllSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !ids.includes(id))
  } else {
    selectedIds.value = [...new Set([...selectedIds.value, ...ids])]
  }
}

function cancelSelect() {
  selectedIds.value = []
}

function resetManageState() {
  manageMode.value = false
  selectedIds.value = []
  moveTarget.value = '默认'
}

function toggleManageMode() {
  if (manageMode.value) {
    resetManageState()
    return
  }

  manageMode.value = true
}

async function deleteSelected() {
  if (!selectedIds.value.length) {
    showTip('请先选择要删除的表情包')
    return
  }

  const ok = confirm('确定删除选中的表情包吗？')
  if (!ok) return

  const ids = [...selectedIds.value]

  await deleteStickers(ids)

  stickers.value = stickers.value.filter(
    item => !ids.includes(item.id)
  )

  selectedIds.value = []
}

async function moveSelected() {
  if (!selectedIds.value.length) {
    showTip('请先选择要移动的表情包')
    return
  }

  if (!moveTarget.value) return

  const ids = [...selectedIds.value]

  await Promise.all(
    ids.map(id => updateSticker(id, {
      category: moveTarget.value
    }))
  )

  stickers.value = stickers.value.map(item => {
    if (!ids.includes(item.id)) return item

    return {
      ...item,
      category: moveTarget.value
    }
  })

  selectedIds.value = []
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('本地图片导出失败'))
    reader.readAsDataURL(blob)
  })
}

function dataUrlToFile(dataUrl, fileName, fallbackType = 'image/png') {
  const [header, base64] = dataUrl.split(',')
  const mimeMatch = header.match(/^data:(.+?);base64$/)
  const mimeType = mimeMatch?.[1] || fallbackType
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return new File([bytes], fileName, {
    type: mimeType
  })
}

async function serializeStickerForExport(item) {
  if (item.source !== 'local') {
    return item
  }

  if (!item.blob) {
    return item
  }

  const imageDataUrl = await blobToDataUrl(item.blob)

  return {
    ...item,
    blob: undefined,
    imageDataUrl,
    fileName: item.blob.name || `${item.id}.png`,
    mimeType: item.blob.type || item.mimeType || 'image/png',
    size: item.blob.size || item.size || 0
  }
}

async function exportSelected() {
  const ids = selectedIds.value

  const targetList = ids.length
    ? stickers.value.filter(item => ids.includes(item.id))
    : stickers.value

  const data = await Promise.all(
    targetList.map(item => serializeStickerForExport(item))
  )

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = url
  a.download = 'stickers.json'
  a.click()

  URL.revokeObjectURL(url)
}

function parseTextImport(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/^(.+?)\s*[:：]\s*(https?:\/\/.+)$/i)

      if (!match) return null

      const desc = match[1].trim()
      const url = match[2].trim()

      if (!desc || !url) return null

      return {
  id: createId(),
  category: getCurrentCategory(),
  text: desc,
  meaning: '',
  description: '',
  url,
  source: 'url'
}

    })
    .filter(Boolean)
}

async function importFromText() {
  const list = parseTextImport(batchText.value)

  if (!list.length) {
    showTip('导入格式错误，示例：开心: https://xxx.com/a.png')
    return
  }

  await bulkAddStickers(list)
  stickers.value.unshift(...list)
  batchText.value = ''

  currentView.value = 'main'
}

async function addImportedList(list) {
  const validList = list
    .map(item => {
      const category = item.category || getCurrentCategory()

      if (!categories.value.includes(category)) {
        categories.value.push(category)
      }

      const id = item.id || createId()

      if (item.source === 'local') {
        const blob = item.blob || (
          item.imageDataUrl
            ? dataUrlToFile(
                item.imageDataUrl,
                item.fileName || `${id}.png`,
                item.mimeType || 'image/png'
              )
            : null
        )

        if (!item.text || !blob) return null

return {
  id,
  category,
  text: item.text,
  description: item.description || '',
  meaning: item.meaning || '',
  source: 'local',
  blob,
  mimeType: blob.type || item.mimeType || 'image/png',
  size: blob.size || item.size || 0
}
      }

      if (!item.text || !item.url) return null

return {
  id,
  category,
  text: item.text,
  description: item.description || '',
  meaning: item.meaning || '',
  url: item.url,
  source: item.source || 'url'
}
    })
    .filter(Boolean)

  if (!validList.length) return

  await bulkAddStickers(validList)
  stickers.value.unshift(...validList)
}

async function importFromFile(event) {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'json') {
      const text = await file.text()
      const data = JSON.parse(text)

      const list = Array.isArray(data) ? data : data.stickers

      if (Array.isArray(list)) {
        await addImportedList(list)
      }
    }

    if (ext === 'txt') {
      const text = await file.text()
      await addImportedList(parseTextImport(text))
    }

    if (ext === 'docx') {
      const buffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer: buffer })
      addImportedList(parseTextImport(result.value))
    }

    currentView.value = 'main'
  } catch (error) {
    console.error(error)
    alert('文件导入失败，请检查文件格式')
  } finally {
    event.target.value = ''
  }
}
</script>

<template>
  <div v-if="visible" class="sticker-panel">
    <!-- 界面1：表情包主页 -->
    <template v-if="currentView === 'main'">
      <div class="panel-top">
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索表情包"
        />

        <button class="text-btn" type="button" @click="currentView = 'import'">
          导入
        </button>

        <button
          class="text-btn"
          type="button"
          @click="toggleManageMode"
        >
          {{ manageMode ? '完成' : '管理' }}
        </button>

      </div>

      <div class="category-row">
        <button
          class="category-btn"
          :class="{ active: activeCategory === '全部' }"
          type="button"
          @click="activeCategory = '全部'"
        >
          全部
        </button>

        <button
          v-for="item in categories"
          :key="item"
          class="category-btn"
          :class="{ active: activeCategory === item }"
          type="button"
          @click="activeCategory = item"
          @mousedown="startCategoryLongPress(item)"
          @mouseup="clearCategoryLongPress"
          @mouseleave="clearCategoryLongPress"
          @touchstart.prevent="startCategoryLongPress(item)"
          @touchend="clearCategoryLongPress"
        >
          {{ item }}
        </button>

        <button class="add-category-btn" type="button" @click="addCategory">
          ＋
        </button>
      </div>

      <div v-if="manageMode" class="manage-bar">
        <button type="button" @click="toggleSelectAll">
          {{ isAllSelected ? '取消全选' : '全选' }}
        </button>

        <button type="button" @click="exportSelected">
          导出
        </button>

        <select v-model="moveTarget">
          <option v-for="item in categories" :key="item" :value="item">
            {{ item }}
          </option>
        </select>

        <button type="button" @click="moveSelected">
          移动
        </button>

        <button type="button" @click="deleteSelected">
          删除
        </button>

      </div>

      <div class="sticker-grid">
        <div
          v-for="item in filteredStickers"
          :key="item.id"
          class="sticker-item"
          :class="{ selected: selectedIds.includes(item.id) }"
          role="button"
          tabindex="0"
          @click="sendSticker(item)"
          @keydown.enter.prevent="sendSticker(item)"
          @keydown.space.prevent="sendSticker(item)"
        >
        <button
          v-if="manageMode"
          type="button"
          class="edit-sticker-btn"
          @click.stop="openEditStickerDialog(item)"
        >
        修改
        </button>

          <span v-if="manageMode" class="check-dot">
            {{ selectedIds.includes(item.id) ? '✓' : '' }}
          </span>

          <img :src="getDisplayUrl(item)" :alt="item.name || item.text" />

          <span class="sticker-text">
            {{ item.text }}
          </span>
        </div>

        <div v-if="!filteredStickers.length" class="empty-text">
          暂无表情包
        </div>
      </div>
    </template>

    <!-- 界面2：导入表情包 -->
    <template v-else>
      <div class="import-header">
        <button type="button" @click="currentView = 'main'">
          ← 返回
        </button>

        <strong>导入表情包</strong>
      </div>

      <div class="import-section">
        <h4>方法一：上传本地图片</h4>

        <input
          v-model="localStickerText"
          class="input"
          placeholder="填写表情包文字，例如：开心"
        />

        <input type="file" accept="image/*" @change="handleLocalFileChange" />

        <div v-if="localStickerUrl" class="local-preview">
          <img :src="localStickerUrl" alt="本地图片预览" />
        </div>

        <button type="button" @click="addLocalSticker">
          添加本地图片
        </button>
      </div>

      <div class="import-section">
        <h4>方法二：文字导入</h4>

        <input
          v-model="urlStickerText"
          class="input"
          placeholder="表情包文字，例如：生气"
        />

        <input
          v-model="urlStickerUrl"
          class="input"
          placeholder="表情包 URL，例如：https://xxx.com/a.png"
        />

        <button type="button" @click="addUrlSticker">
          添加 URL 表情包
        </button>

        <textarea
          v-model="batchText"
          class="textarea"
          placeholder="也可以批量导入，每行一个：开心: https://xxx.com/a.png"
        ></textarea>

        <button type="button" @click="importFromText">
          批量文字导入
        </button>
      </div>

      <div class="import-section">
        <h4>方法三：文件导入</h4>

        <p class="tip">
          支持 json、txt、docx。txt/docx 格式：开心: https://xxx.com/a.png
        </p>

        <label class="file-btn">
          选择文件导入
          <input
            hidden
            type="file"
            accept=".json,.txt,.docx"
            @change="importFromFile"
          />
        </label>
      </div>
    </template>

    <div v-if="dialogVisible" class="cute-dialog-mask" @click.self="closeDialog">
      <div class="cute-dialog">
        <div class="cute-dialog-title">
          {{ dialogTitle }}
        </div>

        <div v-if="dialogMessage" class="cute-dialog-message">
          {{ dialogMessage }}
        </div>

        <div v-if="dialogType === 'edit-sticker'" class="sticker-edit-form">
          <input
            v-model="editStickerForm.text"
            class="cute-dialog-input"
            placeholder="表情包文字"
            @keyup.enter="confirmEditSticker"
          />

          <input
            v-model="editStickerForm.meaning"
            class="cute-dialog-input"
            placeholder="表情包含义"
            @keyup.enter="confirmEditSticker"
          />

          <textarea
            v-model="editStickerForm.description"
            class="cute-dialog-textarea"
            placeholder="表情包描述"
          ></textarea>
       </div>


        <input
          v-if="dialogType === 'add-category' || dialogType === 'rename-category'"
          v-model="dialogInput"
          class="cute-dialog-input"
          placeholder="请输入分组名称"
          @keyup.enter="
            dialogType === 'add-category'
              ? confirmAddCategory()
              : confirmRenameCategory()
          "
        />

        <div v-if="dialogType === 'category-menu'" class="cute-dialog-actions">
          <button
            type="button"
            class="cute-dialog-btn primary"
            @click="openRenameCategoryDialog(dialogTarget)"
          >
            重命名
          </button>

          <button
            v-if="dialogTarget !== '默认'"
            type="button"
            class="cute-dialog-btn danger"
            @click="openDeleteCategoryDialog(dialogTarget)"
          >
            删除
          </button>
        </div>

        <div class="cute-dialog-footer">
          <button
            v-if="dialogType !== 'tip'"
            type="button"
            class="cute-dialog-btn ghost"
            @click="closeDialog"
          >
            取消
          </button>

          <button
            v-if="dialogType === 'add-category'"
            type="button"
            class="cute-dialog-btn primary"
            @click="confirmAddCategory"
          >
            添加
          </button>

          <button
            v-if="dialogType === 'rename-category'"
            type="button"
            class="cute-dialog-btn primary"
            @click="confirmRenameCategory"
          >
            保存
          </button>

          <button
            v-if="dialogType === 'delete-category'"
            type="button"
            class="cute-dialog-btn danger"
            @click="confirmDeleteCategory"
          >
            删除
          </button>

          <button
            v-if="dialogType === 'tip'"
            type="button"
            class="cute-dialog-btn primary"
            @click="closeDialog"
          >
            知道啦
          </button>

          <button
            v-if="dialogType === 'edit-sticker'"
            type="button"
            class="cute-dialog-btn primary"
            @click="confirmEditSticker"
          >
          保存
          </button>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sticker-panel {
  height: 380px;
  background: #fff;
  border-top: 1px solid #ffe6f0;
  padding: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

.panel-top {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: 1px solid #ffe6f0;
  border-radius: 999px;
  padding: 8px 12px;
  outline: none;
  font-size: 13px;
}

button,
.file-btn {
  border: none;
  border-radius: 8px;
  padding: 8px 10px;
  background: #fff0f5;
  color: #d94f86;
  font-size: 12px;
  cursor: pointer;
  line-height: 1;
}

button:active,
.file-btn:active {
  opacity: 0.75;
}

.text-btn {
  white-space: nowrap;
}

.category-row {
  display: flex;
  gap: 8px;
  align-items: center;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.category-btn,
.add-category-btn {
  flex-shrink: 0;
  border-radius: 999px;
}

.category-btn.active {
  background: #ffb7d2;
  color: #fff;
}

.add-category-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  font-size: 18px;
}

.manage-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 8px;
  margin-bottom: 10px;
  background: #fff7fb;
  border-radius: 10px;
}

.manage-bar select {
  border: 1px solid #ffe6f0;
  border-radius: 8px;
  padding: 7px;
  outline: none;
  color: #d94f86;
  background: #fff;
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.sticker-item {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 86px;
  padding: 6px;
  background: #fff7fb;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  overflow: hidden;
}

.sticker-item.selected {
  border-color: #ff7fb0;
  background: #ffe6f0;
}

.sticker-item img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  flex-shrink: 0;
}

.sticker-text {
  width: 100%;
  min-width: 0;
  margin-top: 5px;
  color: #666;
  font-size: 11px;
  line-height: 1.2;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: center;
}

.check-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ff7fb0;
  color: #fff;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}

.empty-text {
  grid-column: 1 / -1;
  padding: 30px 0;
  text-align: center;
  color: #aaa;
  font-size: 13px;
}

.import-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.import-header strong {
  color: #d94f86;
  font-size: 15px;
}

.import-section {
  padding: 10px;
  margin-bottom: 12px;
  background: #fff7fb;
  border-radius: 10px;
}

.import-section h4 {
  margin: 0 0 8px;
  color: #d94f86;
  font-size: 14px;
}

.input,
.textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #ffe6f0;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
  outline: none;
  font-size: 13px;
}

.textarea {
  height: 72px;
  resize: none;
  margin-top: 8px;
}

.local-preview {
  margin: 8px 0;
  width: 90px;
  height: 90px;
  background: #fff;
  border: 1px solid #ffe6f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.local-preview img {
  max-width: 80px;
  max-height: 80px;
  object-fit: contain;
}

.tip {
  margin: 0 0 8px;
  color: #999;
  font-size: 12px;
  line-height: 1.5;
}

.cute-dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: rgba(60, 30, 45, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  box-sizing: border-box;
}

.cute-dialog {
  width: min(300px, 100%);
  background: #fff;
  border-radius: 18px;
  padding: 18px;
  box-sizing: border-box;
  box-shadow: 0 16px 40px rgba(217, 79, 134, 0.22);
  border: 1px solid #ffe6f0;
  animation: cute-dialog-pop 0.18s ease;
}

.cute-dialog-title {
  color: #d94f86;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 8px;
}

.cute-dialog-message {
  color: #777;
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
  margin-bottom: 14px;
  white-space: pre-line;
}

.cute-dialog-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #ffe6f0;
  border-radius: 999px;
  padding: 10px 14px;
  outline: none;
  color: #333;
  font-size: 14px;
  background: #fff7fb;
  margin-bottom: 14px;
}

.cute-dialog-input:focus {
  border-color: #ffb7d2;
  box-shadow: 0 0 0 3px rgba(255, 183, 210, 0.25);
}

.cute-dialog-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.cute-dialog-actions .cute-dialog-btn {
  flex: 1;
}

.cute-dialog-footer {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.cute-dialog-btn {
  min-width: 76px;
  border-radius: 999px;
  padding: 9px 14px;
  font-size: 13px;
}

.cute-dialog-btn.primary {
  background: #ffb7d2;
  color: #fff;
}

.cute-dialog-btn.danger {
  background: #ffe8ee;
  color: #ff4f7b;
}

.cute-dialog-btn.ghost {
  background: #f7f7f7;
  color: #999;
}

@keyframes cute-dialog-pop {
  from {
    transform: scale(0.92);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

.sticker-item {
  position: relative;
  cursor: pointer;
}

.edit-sticker-btn {
  position: absolute;
  top: 5px;
  left: 5px;
  z-index: 2;
  min-width: 0;
  padding: 4px 8px;
  border-radius: 999px;
  background: #ffb7d2;
  color: #fff;
  font-size: 11px;
  line-height: 1;
}

.sticker-edit-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.cute-dialog-textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 72px;
  resize: none;
  border: 1px solid #ffe6f0;
  border-radius: 12px;
  padding: 10px 14px;
  outline: none;
  color: #333;
  font-size: 14px;
  background: #fff7fb;
}

.cute-dialog-textarea:focus {
  border-color: #ffb7d2;
  box-shadow: 0 0 0 3px rgba(255, 183, 210, 0.25);
}


</style>
