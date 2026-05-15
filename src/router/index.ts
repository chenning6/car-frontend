import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import PostDetail from '@/views/PostDetail.vue'
import PostCreate from '@/views/PostCreate.vue'
import Profile from '@/views/Profile.vue'
import MyPosts from '@/views/MyPosts.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/post/:id', name: 'PostDetail', component: PostDetail },
  { path: '/post/create', name: 'PostCreate', component: PostCreate },
  { path: '/post/edit/:id', name: 'PostEdit', component: PostCreate },
  { path: '/profile', name: 'Profile', component: Profile },
  { path: '/my-posts', name: 'MyPosts', component: MyPosts },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router