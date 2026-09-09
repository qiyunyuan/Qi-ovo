import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home/HomeScreen.vue')
  },
  {
    // chat 单独出来，不再依赖 MessageApp
    path: '/chat',
    name: 'chat',
    component: () => import('../views/Chat/ChatScreen.vue')
  },
  {
    path: '/chat-settings',
    name: 'ChatSettings',
    component: () => import('@/views/Chat/ChatSettings/ChatSettings.vue')
  },
  {
    path: '/info-app',
    name: 'info-app',
    component: () => import('../views/InfoApp/InfoApp.vue')
  },
  {
    path: '/info-app/profile',
    name: 'info-profile',
    component: () => import('../views/InfoApp/ProfileInfo.vue')
  },
  {
    path: '/info-app/char',
    name: 'info-char',
    component: () => import('../views/InfoApp/CharInfo.vue')
  },
  {
    path: '/api-manager',
    name: 'api-manager',
    component: () => import('../views/Settings/ApiManager.vue')
  },
  {
    path: '/api-pool',
    name: 'api-pool',
    component: () => import('../views/Settings/ApiPool.vue')
  },
  {
    path: '/prompt',
    name: 'prompt-home',
    component: () => import('../views/Prompt/PromptHome.vue')
  },
  {
    path: '/prompt/edit/:id',
    name: 'prompt-edit',
    component: () => import('../views/Prompt/PromptEdit.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings/Settings.vue')
  },
  {
    path: '/debug/prompt',
    name: 'prompt-debug',
    component: () => import('../views/Debug/PromptDebug.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
