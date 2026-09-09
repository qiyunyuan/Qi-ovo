<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import PhoneFrame from '../../components/PhoneFrame.vue'
import { useProfileStore } from '../../stores/profile'
import { useCharStore } from '../../stores/char'
import { resolveAvatarValue } from '../../services/avatar'

const router = useRouter()
const profileStore = useProfileStore()
const charStore = useCharStore()

const userInfo = ref(null)
const charInfo = ref(null)

// ── 头像处理：Blob → objectURL，URL / 路径 / data: 直接用，旧 emoji 不再显示 ──
let userUrl = null
let charUrl = null
const userAvatar = ref('')
const charAvatar = ref('')

function resolveAvatar(av) {
  return resolveAvatarValue(av).src
}

function refreshAvatars() {
  if (userUrl) { URL.revokeObjectURL(userUrl); userUrl = null }
  if (charUrl) { URL.revokeObjectURL(charUrl); charUrl = null }
  userAvatar.value = resolveAvatar(userInfo.value?.avatar)
  charAvatar.value = resolveAvatar(charInfo.value?.avatar)
}

onMounted(async () => {
  await Promise.all([profileStore.load(), charStore.load()])
  userInfo.value = profileStore.info
  charInfo.value = charStore.info
  refreshAvatars()
})

onUnmounted(() => {
  if (userUrl) URL.revokeObjectURL(userUrl)
  if (charUrl) URL.revokeObjectURL(charUrl)
})

// ── 生日只取日期部分（date input 可能带时间）──
function formatBirthday(b) {
  if (!b) return ''
  return String(b).slice(0, 10)
}

// ── 两张信息卡片：左图，右为 名字 / 性别 · 生日 ──
const cards = computed(() => [
  {
    id: 'user',
    title: userInfo.value?.name || 'User',
    tag: '个人信息',
    gender: userInfo.value?.gender || '未填写',
    birthday: formatBirthday(userInfo.value?.birthday) || '未填写',
    avatarSrc: userAvatar.value,
    emoji: '👤',
    color: '#ff9eb5',
    bg: '#fff0f5',
    route: '/info-app/profile'
  },
  {
    id: 'char',
    title: charInfo.value?.name || 'Char',
    tag: '角色信息',
    gender: charInfo.value?.gender || '未填写',
    birthday: formatBirthday(charInfo.value?.birthday) || '未填写',
    avatarSrc: charAvatar.value,
    emoji: '💑',
    color: '#b4a0e0',
    bg: '#f5f0ff',
    route: '/info-app/char'
  }
])

function goTo(card) {
  router.push(card.route)
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <PhoneFrame>
    <div class="info-app">
      <!-- 顶部栏 -->
      <div class="page-header">
        <div class="header-btn" @click="goHome">‹</div>
        <div class="header-title">资料管理</div>
        <div class="header-btn"></div>
      </div>

      <!-- 关系卡片：User ♥ Char，默认恋人 -->
      <div class="relation-card">
        <div class="rel-person">
          <img v-if="userAvatar" :src="userAvatar" class="rel-avatar" alt="我的头像" />
          <div v-else class="rel-avatar rel-avatar-placeholder"></div>
          <div class="rel-name">{{ userInfo?.name || 'User' }}</div>
        </div>

        <div class="rel-middle">
          <div class="rel-heart">💗</div>
          <div class="rel-status">恋人</div>
        </div>

        <div class="rel-person">
          <img v-if="charAvatar" :src="charAvatar" class="rel-avatar" alt="TA的头像" />
          <div v-else class="rel-avatar rel-avatar-placeholder"></div>
          <div class="rel-name">{{ charInfo?.name || 'Char' }}</div>
        </div>
      </div>

      <!-- 提示语 -->
      <div class="welcome-text">选择要查看或编辑的资料</div>

      <!-- 两张卡片：左图右信息 -->
      <div class="card-list">
        <div
          v-for="card in cards"
          :key="card.id"
          class="card"
          :style="{ '--card-color': card.color, '--card-bg': card.bg }"
          @click="goTo(card)"
        >
          <img
            v-if="card.avatarSrc"
            :src="card.avatarSrc"
            class="card-avatar"
            :alt="card.title + '的头像'"
          />
          <div v-else class="card-avatar card-avatar-placeholder"></div>

          <div class="card-body">
            <div class="card-title">
              {{ card.title }}
              <span class="card-tag">{{ card.tag }}</span>
            </div>
            <div class="card-meta">
              <span>{{ card.gender }}</span>
              <span class="meta-dot">·</span>
              <span>{{ card.birthday }}</span>
            </div>
          </div>
          <div class="card-arrow">›</div>
        </div>
      </div>
    </div>
  </PhoneFrame>
</template>

<style scoped>
.info-app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #fce4ec 0%, #f8f0ff 100%);
}

.page-header {
  height: 60px;
  background-color: #e8b4d0;
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

/* ── 关系卡片 ── */
.relation-card {
  margin: 14px 16px 0;
  padding: 16px 14px;
  background: linear-gradient(135deg, #ffffff 0%, #ffeef6 100%);
  border: 1px solid #ffdce9;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 16px rgba(255, 140, 180, 0.18);
  flex-shrink: 0;
}

.rel-person {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 86px;
  min-width: 0;
}

.rel-avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  object-fit: cover;
  background: #fff0f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.rel-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}

.rel-name {
  font-size: 13px;
  font-weight: 600;
  color: #3d2a38;
  max-width: 86px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rel-middle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.rel-heart {
  font-size: 26px;
  line-height: 1;
  animation: heartbeat 1.6s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.15); }
  40% { transform: scale(1); }
  55% { transform: scale(1.1); }
}

.rel-status {
  font-size: 12px;
  font-weight: 600;
  color: #e05a8a;
  background: #ffe1ec;
  padding: 2px 12px;
  border-radius: 999px;
}

/* ── 提示语 ── */
.welcome-text {
  text-align: center;
  padding: 16px 16px 10px;
  font-size: 14px;
  color: #8a7a90;
  letter-spacing: 0.5px;
}

/* ── 信息卡片列表 ── */
.card-list {
  flex: 1;
  padding: 6px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.card {
  background: #ffffff;
  border-radius: 18px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  box-shadow: 0 3px 14px rgba(0, 0, 0, 0.06);
  transition: transform 0.15s, box-shadow 0.15s;
  border-left: 5px solid var(--card-color);
}

.card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
}

.card-avatar {
  width: 62px;
  height: 62px;
  border-radius: 16px;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--card-bg);
}

.card-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 17px;
  font-weight: 700;
  color: #3d2a38;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.card-tag {
  font-size: 11px;
  font-weight: 600;
  color: var(--card-color);
  background: var(--card-bg);
  padding: 2px 8px;
  border-radius: 999px;
}

.card-meta {
  font-size: 13px;
  color: #a88895;
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-dot {
  color: #d9c0c9;
  font-size: 10px;
}

.card-arrow {
  font-size: 22px;
  color: #c9a0af;
  flex-shrink: 0;
}

.rel-avatar-placeholder {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #f0f0f0;
}

.card-avatar-placeholder {
  width: 62px;
  height: 62px;
  border-radius: 16px;
  background: #f0f0f0;
}

</style>
