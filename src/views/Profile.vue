<template>
  <div class="profile-page">
    <div class="profile-card">
      <h2>{{ $t('profile') }}</h2>

      <div class="user-info" v-if="authStore.user">
        <div class="info-item">
          <span class="label">{{ $t('username') }}:</span>
          <span>{{ authStore.user.username }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ $t('email') }}:</span>
          <span>{{ authStore.user.email || '-' }}</span>
        </div>
      </div>

      <div class="my-posts">
        <h3>{{ $t('myPostsTitle') }}</h3>
        <div class="post-list" v-if="myPosts.length">
          <div class="post-item" v-for="post in myPosts" :key="post.id">
            <div class="post-title">{{ post.title }}</div>
            <div class="post-status">
              <el-tag :type="post.status === 'approved' ? 'success' : post.status === 'rejected' ? 'danger' : 'warning'">
                {{ $t(post.status) }}
              </el-tag>
            </div>
            <div class="post-actions">
              <el-button size="small" @click="router.push('/post/' + post.id)">{{ $t('view') }}</el-button>
            </div>
          </div>
        </div>
        <el-empty v-else :description="$t('noPostsYet')" />
      </div>

      <div class="actions">
        <el-button type="danger" @click="handleLogout">{{ $t('logout') }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const myPosts = ref([
  { id: 1, title: 'Toyota Camry 2022', status: 'approved' },
  { id: 2, title: 'Honda Civic', status: 'pending' },
])

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
  }
})
</script>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  background: #fff;
  padding: 30px;
  border-radius: 8px;
}

.profile-card h2 {
  margin-bottom: 24px;
}

.info-item {
  margin-bottom: 16px;
}

.info-item .label {
  font-weight: bold;
  margin-right: 8px;
}

.my-posts {
  margin-top: 30px;
}

.my-posts h3 {
  margin-bottom: 16px;
}

.post-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 12px;
}

.post-title {
  flex: 1;
}

.post-status {
  margin-right: 12px;
}

.actions {
  margin-top: 30px;
}
</style>