import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import ChatPage from './components/ChatPage.vue'
import SkillsPage from './components/SkillsPage.vue'
import './style.css'

// 定义路由
const routes = [
  { path: '/', redirect: '/chat' }, // 默认重定向到聊天页面
  { path: '/chat', component: ChatPage, name: 'Chat' },
  { path: '/skills', component: SkillsPage, name: 'Skills' }
]

// 创建路由器实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 创建并挂载根实例
const app = createApp(App)

app.use(router)
app.mount('#app')