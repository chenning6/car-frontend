<template>
  <div id="app">
    <header class="header">
      <div class="header-content">
        <div class="logo-section">
          <router-link to="/" class="logo">🚗</router-link>
          <div class="company-name">
            <span class="name">中国汽车联盟</span>
            <span class="slogan"> Mongolia Car Market</span>
          </div>
        </div>
        <nav class="nav">
          <router-link to="/" class="nav-link" active-class="active">{{ $t('home') }}</router-link>
          <router-link to="/post/create" class="nav-link" active-class="active">{{ $t('publish') }}</router-link>
          <router-link to="/my-posts" class="nav-link" active-class="active" v-if="authStore.isLoggedIn">{{ $t('myPosts') }}</router-link>
          <el-dropdown @command="changeLang">
            <span class="lang-btn">
              🌐 {{ localeName }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="zh-CN">中文</el-dropdown-item>
                <el-dropdown-item command="en">English</el-dropdown-item>
                <el-dropdown-item command="mn">Монгол</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <template v-if="authStore.isLoggedIn">
            <router-link to="/profile" class="nav-link" active-class="active">{{ authStore.user?.username }}</router-link>
            <a @click="logout" class="nav-link">{{ $t('logout') }}</a>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-link">{{ $t('login') }}</router-link>
            <router-link to="/register" class="nav-link">{{ $t('register') }}</router-link>
          </template>
        </nav>
      </div>
    </header>
    
    <main class="main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <footer class="footer">
      <p>© 中国汽车联盟</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const { locale } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const localeName = computed(() => {
  const names: Record<string, string> = {
    'zh-CN': '中文',
    'en': 'English',
    'mn': 'Монгол',
  }
  return names[locale.value] || '中文'
})

function changeLang(lang: string) {
  locale.value = lang
}

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  authStore.init()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  text-decoration: none;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-section .logo {
  font-size: 32px;
}

.company-name {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.company-name .name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.company-name .slogan {
  font-size: 11px;
  color: #999;
}

.nav {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav a {
  color: #666;
  text-decoration: none;
  transition: color 0.3s;
}

.nav a:hover {
  color: #409eff;
}

.nav-link {
  padding: 6px 12px;
  border-radius: 4px;
}

.nav-link.active {
  background: #409eff;
  color: #fff;
}

.nav-link.active:hover {
  color: #fff;
}

.lang-btn {
  cursor: pointer;
  color: #666;
}

.main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  background: #f5f5f5;
}

.footer {
  background: #fff;
  padding: 20px;
  text-align: center;
  color: #999;
  margin-top: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .header-content {
    padding: 8px 12px;
    height: auto;
    justify-content: space-between;
  }

  .logo-section {
    gap: 6px;
    max-width: 45%;
  }

  .logo-section .logo {
    font-size: 24px;
  }

  .company-name {
    flex-direction: column;
    gap: 1px;
  }

  .company-name .name {
    font-size: 13px;
    white-space: nowrap;
  }

  .company-name .slogan {
    font-size: 9px;
    white-space: nowrap;
  }

  .nav {
    gap: 4px;
    flex-wrap: nowrap;
  }

  .nav-link {
    padding: 4px 6px;
    font-size: 12px;
    white-space: nowrap;
  }

  .lang-btn {
    font-size: 12px;
    padding: 4px 6px;
  }

  .main {
    padding: 12px;
  }
}

@media (max-width: 400px) {
  .header-content {
    padding: 6px 10px;
  }

  .logo-section .logo {
    font-size: 22px;
  }

  .company-name .name {
    font-size: 12px;
  }

  .company-name .slogan {
    font-size: 9px;
  }

  .nav-link {
    padding: 4px 6px;
    font-size: 11px;
  }

  .lang-btn {
    font-size: 11px;
    padding: 4px 6px;
  }
}
</style>