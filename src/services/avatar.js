// services/avatar.js —— 统一头像解析，供多个页面共用

// 判断一个值是否可以直接丢给 <img :src>
// 支持：http(s)://、绝对路径 /、data:、blob:（不含 emoji 和空串）
export function isImageSrc(v) {
  return !!v && /^(https?:\/\/|\/|data:|blob:)/i.test(v)
}

// 解析头像值 → 返回 { src, emoji }
// src: 可直接用于 <img :src> 的地址（或 ''）
// emoji: 无图片时的 emoji 兜底（可留空表示空白头像）
export function resolveAvatarValue(av) {
  if (av instanceof Blob) return { src: URL.createObjectURL(av), emoji: '' }
  if (isImageSrc(av)) return { src: av, emoji: '' }
  // 纯 emoji / 普通字符串当作兜底 emoji；空串则空白
  if (typeof av === 'string' && av) return { src: '', emoji: av }
  return { src: '', emoji: '' }
}
