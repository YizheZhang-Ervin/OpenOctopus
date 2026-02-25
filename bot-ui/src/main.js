import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import ChatPage from './components/ChatPage.vue'
import SkillsPage from './components/SkillsPage.vue'
import './style.css'

// Define routes
const routes = [
  { path: '/', redirect: '/chat' }, // Default redirect to chat page
  { path: '/chat', component: ChatPage, name: 'Chat' },
  { path: '/skills', component: SkillsPage, name: 'Skills' }
]

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Create and mount root instance
const app = createApp(App)

app.use(router)
app.mount('#app')