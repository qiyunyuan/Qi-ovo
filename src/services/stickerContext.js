// src/services/stickerContext.js
import { getStickerById } from './stickerDb'

export async function stickerMessageToAiContext(message) {
  const stickerId = message.payload?.stickerId
  if (!stickerId) return '[发送了一个表情包]'

  const sticker = await getStickerById(stickerId)
  if (!sticker) return '[发送了一个已失效的表情包]'

const text = sticker.text || '表情包'
const meaning = sticker.meaning || sticker.description || ''

return meaning
  ? `[发送了表情包：${text}。含义：${meaning}]`
  : `[发送了表情包：${text}]`
}
