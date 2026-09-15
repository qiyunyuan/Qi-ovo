// src/services/stickerDb.js
import Dexie from 'dexie'

export const stickerDb = new Dexie('qi_yunovo_sticker_db')

stickerDb.version(1).stores({
  stickers: 'id, category, source',
  categories: 'name'
})

export async function getAllStickerCategories() {
  const list = await stickerDb.categories.toArray()
  const names = list.map(item => item.name)

  return names.includes('默认') ? names : ['默认', ...names]
}

export async function saveStickerCategories(categories) {
  await stickerDb.transaction('rw', stickerDb.categories, async () => {
    await stickerDb.categories.clear()
    await stickerDb.categories.bulkPut(
      categories.map(name => ({
        name
      }))
    )
  })
}

export async function getAllStickers() {
  return stickerDb.stickers.toArray()
}

export async function addSticker(sticker) {
  await stickerDb.stickers.put(sticker)
  return sticker
}

export async function bulkAddStickers(stickers) {
  if (!stickers.length) return
  await stickerDb.stickers.bulkPut(stickers)
}

export async function updateSticker(id, patch) {
  await stickerDb.stickers.update(id, patch)
}

export async function deleteStickers(ids) {
  await stickerDb.stickers.bulkDelete(ids)
}

export async function clearStickers() {
  await stickerDb.stickers.clear()
}

export async function getStickerById(id) {
  return stickerDb.stickers.get(id)
}

export function getStickerImageUrl(sticker) {
  if (!sticker) return ''

  if (sticker.source === 'local' && sticker.blob) {
    return URL.createObjectURL(sticker.blob)
  }

  return sticker.url || ''
}
