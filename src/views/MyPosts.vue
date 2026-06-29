<template>
  <div class="my-posts">
    <div class="page-header">
      <div class="header-left">
        <h2>{{ $t('myPosts') }}</h2>
      </div>
      <el-button type="primary" @click="$router.push('/post/create')">
        <el-icon style="margin-right: 4px"><Plus /></el-icon>{{ $t('publish') }}
      </el-button>
    </div>
    
    <el-tabs v-model="activeTab" class="status-tabs" @tab-change="loadPosts">
      <el-tab-pane name="all">
        <template #label><span>{{ $t('all') }}</span></template>
      </el-tab-pane>
      <el-tab-pane name="pending">
        <template #label><span>{{ $t('pending') }}</span></template>
      </el-tab-pane>
      <el-tab-pane name="approved">
        <template #label><span>{{ $t('approved') }}</span></template>
      </el-tab-pane>
      <el-tab-pane name="rejected">
        <template #label><span>{{ $t('rejected') }}</span></template>
      </el-tab-pane>
    </el-tabs>
    
    <div class="post-list" v-if="posts.length">
      <div class="post-card" v-for="post in posts" :key="post.id">
        <div class="post-image">
          <img :src="getImageUrl(post.coverImage)" @error="fixImage" />
        </div>
        <div class="post-info">
          <h3>{{ post.title }}</h3>
          <p class="price">{{ formatPrice(post.price) }} {{ post.currency }}</p>
          <div class="status-tags">
            <el-tag :type="getStatusType(post.status)" size="small">
              {{ getStatusText(post.status) }}
            </el-tag>
          </div>
          <p class="desc" @click="post._showFull = false" v-if="post._showFull">
  {{ post.description }}<span class="collapse">{{ $t('collapse') }}</span>
</p>
<p class="desc" @click="post._showFull = true" v-else-if="post.description?.length > 300">
  {{ post.description?.slice(0, 300) }}<span class="expand">{{ $t('viewMore') }}</span>
</p>
<p class="desc" v-else>{{ post.description }}</p>
          <div class="actions">
            <el-button size="small" @click="viewDetail(post.id)">{{ $t('viewDetail') }}</el-button>
            <el-button size="small" type="primary" @click="editPost(post.id)">{{ $t('edit') }}</el-button>
            <el-button size="small" type="danger" @click="deletePost(post.id)">{{ $t('delete') }}</el-button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="empty" v-else>
      <el-empty :description="$t('noResults')" />
    </div>
    
    <div class="pagination">
      <el-pagination
        v-model:current-page="page"
        :page-size="size"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadPosts"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { postApi } from '@/api'

const { t } = useI18n()
const router = useRouter()

const activeTab = ref('all')
const page = ref(1)
const size = ref(10)
const total = ref(0)
const posts = ref<any[]>([])

async function loadPosts() {
  try {
    const res = await postApi.myList(page.value - 1, size.value, activeTab.value === 'all' ? undefined : activeTab.value)
    if (res.data?.code === 200) {
      posts.value = res.data.data?.content || []
      total.value = res.data.data?.total || 0
    }
  } catch (error) {
    console.error(error)
  }
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: t('pending'),
    approved: t('approved'),
    rejected: t('rejected')
  }
  return map[status] || status
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('mn-MN').format(price || 0)
}

function getImageUrl(url: string) {
  if (!url) return '/placeholder.svg'
  if (url.startsWith('data:image/')) return url
  if (url.startsWith('http')) return url
  if (url.startsWith('/api/')) return url
  if (url.startsWith('/uploads/')) return '/api/upload' + url
  return '/api' + url
}

function fixImage(e: Event) {
  (e.target as HTMLImageElement).src = '/placeholder.svg'
}

function viewDetail(id: number) {
  router.push('/post/' + id)
}

function editPost(id: number) {
  router.push('/post/edit/' + id)
}

function viewFullDesc(post: any) {
  post._showFull = true
}

async function deletePost(id: number) {
  try {
    await ElMessageBox.confirm(t('confirmDelete'), t('warning'), {
      confirmButtonText: t('confirm'),
      cancelButtonText: t('cancel'),
      type: 'warning'
    })
    
    await postApi.delete(id)
    ElMessage.success(t('deleteSuccess'))
    loadPosts()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error || t('deleteFailed'))
    }
  }
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.my-posts {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
}

.status-tabs {
  margin-top: 20px;
  background: #fff;
  border-radius: 8px 8px 0 0;
  padding: 0 20px;
}

.status-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.status-tabs :deep(.el-tabs__item) {
  font-size: 15px;
}

.status-tabs :deep(.el-tabs__item .el-badge__content) {
  display: none;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fff;
  border-radius: 0 0 8px 8px;
  padding: 20px;
}

.post-card {
  display: flex;
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eee;
  transition: all 0.3s;
}

.post-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.post-image {
  width: 160px;
  min-width: 160px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
  overflow: hidden;
  border-radius: 8px 0 0 8px;
}

.post-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.post-info {
  flex: 1;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.post-info h3 {
  margin: 0 0 4px 0;
  font-size: 15px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
  margin: 0 0 6px 0;
}

.status-tags {
  margin-bottom: 6px;
}

.desc {
  color: #999;
  font-size: 12px;
  margin: 0 0 10px 0;
  flex: 1;
  line-height: 1.5;
}

.desc .expand, .desc .collapse {
  color: #409eff;
  cursor: pointer;
  margin-left: 4px;
}

.actions {
  display: flex;
  gap: 8px;
}

.empty {
  padding: 60px 0;
}

.pagination {
  margin-top: 20px;
  justify-content: center;
  display: flex;
}

@media (max-width: 768px) {
  .post-card {
    flex-direction: column;
  }
  
  .post-image {
    width: 100%;
    height: 200px;
  }
}
</style>
