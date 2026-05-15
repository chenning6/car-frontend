<template>
  <div class="post-detail" v-if="post">
    <div class="gallery">
      <div class="main-image">
        <button class="arrow left" @click="prevImage" v-if="allImages.length > 1">‹</button>
        <img :src="currentImage" :alt="post.title" @error="fixImage" @click="showPreview = true" />
        <button class="arrow right" @click="nextImage" v-if="allImages.length > 1">›</button>
      </div>
      <div class="thumbnails" v-if="allImages.length > 1">
        <img 
          v-for="(img, index) in allImages" 
          :src="getImageUrl(img.imageUrl || img)" 
          :key="index"
          :class="{ active: index === currentIndex }"
          @click="currentIndex = index"
          @error="fixImage"
        />
      </div>
    </div>
    
    <div class="info">
      <div class="info-content">
        <h1>{{ post.title }}</h1>
        <p class="price">{{ formatPrice(post.price) }} {{ $t('currency') }}</p>
        
        <div class="tags">
          <el-tag :type="post.carType === 'new' ? 'success' : 'warning'">
            {{ post.carType === 'new' ? $t('newCar') : $t('usedCar') }}
          </el-tag>
          <el-tag>{{ post.year }}</el-tag>
          <el-tag v-if="post.mileage">{{ post.mileage }}km</el-tag>
          <el-tag v-if="post.brand">{{ post.brand }}</el-tag>
          <el-tag v-if="post.model">{{ post.model }}</el-tag>
        </div>
        
        <div class="details">
          <p>{{ post.description }}</p>
        </div>
        
        <div class="contact">
          <h3>{{ $t('contact') }}</h3>
          <el-button type="primary" @click="handleViewContact">
            {{ $t('viewContact') }}
          </el-button>
        </div>
      </div>
      
      <div class="comments-section">
        <h3 class="comments-title">评论区 ({{ comments.length }})</h3>
        <div class="comments-list">
          <div class="comment-item" v-for="comment in comments" :key="comment.id">
            <div class="comment-header">
              <span class="comment-user">{{ comment.username || '用户' + comment.userId }}</span>
              <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
              <el-button 
                v-if="comment.userId === currentUserId" 
                type="danger" 
                size="small" 
                text
                @click="deleteComment(comment.id)"
              >删除</el-button>
            </div>
            <p class="comment-content">{{ comment.content }}</p>
          </div>
          <div class="no-comments" v-if="comments.length === 0">
            暂无评论，快来抢沙发~
          </div>
        </div>
        
        <div class="comment-input" v-if="authStore.isLoggedIn">
          <el-input
            v-model="commentContent"
            :rows="2"
            type="textarea"
            :placeholder="'说点什么吧...'"
            @keyup.ctrl.enter="submitComment"
          />
          <el-button type="primary" @click="submitComment" :disabled="!commentContent.trim()">
            发送
          </el-button>
        </div>
        <div class="comment-login-tip" v-else>
          <router-link to="/login">登录</router-link>后可发表评论
        </div>
      </div>
    </div>
    
    <el-dialog v-model="showPreview" width="90%" destroy-on-close @click="showPreview = false">
      <div class="preview-full" @click="showPreview = false">
        <button class="arrow left" @click.stop="prevImage">‹</button>
        <img :src="currentImage" @error="fixImage" />
        <button class="arrow right" @click.stop="nextImage">›</button>
      </div>
    </el-dialog>
    
    <el-dialog v-model="showContact" title="联系方式" width="400px">
      <div v-if="post.contactPhone">
        <p><strong>{{ $t('phone') }}:</strong> {{ post.contactPhone }}</p>
      </div>
      <div v-if="post.contactWechat">
        <p><strong>{{ $t('wechat') }}:</strong> {{ post.contactWechat }}</p>
      </div>
    </el-dialog>
  </div>
  
  <div v-else-if="loading" class="loading">
    <el-skeleton :rows="5" animated />
  </div>
  
  <div v-else class="not-found">
    <el-empty :description="$t('postNotFound')" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { postApi, commentApi } from '@/api'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const post = ref<any>(null)
const images = ref<any[]>([])
const allImages = ref<any[]>([])
const currentIndex = ref(0)
const showContact = ref(false)
const showPreview = ref(false)
const loading = ref(false)
const comments = ref<any[]>([])
const commentContent = ref('')

const currentUserId = computed(() => authStore.user?.id)

function getImageUrl(url: string) {
  if (!url) return '/placeholder.jpg'
  if (url.startsWith('http')) return url
  const filename = url.split('/').pop()
  return 'http://localhost:8080/api/upload/uploads/' + filename
}

const currentImage = computed(() => {
  if (allImages.value.length === 0) return '/placeholder.jpg'
  return getImageUrl(allImages.value[currentIndex.value]?.imageUrl || allImages.value[currentIndex.value])
})

function prevImage() {
  currentIndex.value = currentIndex.value > 0 ? currentIndex.value - 1 : allImages.value.length - 1
}

function nextImage() {
  currentIndex.value = currentIndex.value < allImages.value.length - 1 ? currentIndex.value + 1 : 0
}

function fixImage(e: Event) {
  (e.target as HTMLImageElement).src = '/placeholder.jpg'
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('mn-MN').format(price || 0)
}

function formatTime(time: string) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function loadPost() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const res = await postApi.detail(id)
    if (res.data?.code === 200) {
      post.value = res.data.data
      images.value = res.data.data?.images || []
      const imgList = res.data.data?.images || []
      if (post.value.coverImage) {
        allImages.value = [post.value.coverImage, ...imgList.map((i: any) => i.imageUrl)]
      } else {
        allImages.value = imgList.map((i: any) => i.imageUrl)
      }
      await loadComments()
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function loadComments() {
  try {
    const res = await commentApi.list(Number(route.params.id))
    if (res.data?.code === 200) {
      comments.value = res.data.data || []
    }
  } catch (error) {
    console.error(error)
  }
}

async function submitComment() {
  if (!commentContent.value.trim()) return
  try {
    const res = await commentApi.create(Number(route.params.id), commentContent.value)
    if (res.data?.code === 200 || res.status === 200) {
      comments.value.unshift(res.data.data)
      commentContent.value = ''
      ElMessage.success('评论成功')
    }
  } catch (error: any) {
    ElMessage.error(error || '评论失败')
  }
}

async function deleteComment(id: number) {
  try {
    await commentApi.delete(id)
    comments.value = comments.value.filter(c => c.id !== id)
    ElMessage.success('删除成功')
  } catch (error: any) {
    ElMessage.error(error || '删除失败')
  }
}

function handleViewContact() {
  if (!authStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  showContact.value = true
}

onMounted(() => {
  loadPost()
})
</script>

<style scoped>
.post-detail {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
}

.gallery, .info {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  min-height: 500px;
}

.gallery {
  display: flex;
  flex-direction: column;
}

.main-image {
  height: 350px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
}

.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  font-size: 40px;
  width: 50px;
  height: 80px;
  cursor: pointer;
  z-index: 10;
}

.arrow.left { left: 0; border-radius: 0 8px 8px 0; }
.arrow.right { right: 0; border-radius: 8px 0 0 8px; }
.arrow:hover { background: rgba(0, 0, 0, 0.7); }

.thumbnails {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.thumbnails img {
  width: 70px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  flex-shrink: 0;
}

.thumbnails img.active {
  border-color: #409eff;
}

.thumbnails img:hover {
  border-color: #409eff;
}

.info {
  display: flex;
  flex-direction: column;
  padding: 0;
}

.info-content {
  padding: 16px;
  flex-shrink: 0;
}

.info h1 {
  margin-bottom: 8px;
  font-size: 18px;
  line-height: 1.4;
}

.info .price {
  font-size: 22px;
  font-weight: bold;
  color: #f56c6c;
  margin-bottom: 10px;
}

.info .tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.info .details {
  margin-bottom: 10px;
  word-wrap: break-word;
  word-break: break-all;
}

.info .details p {
  white-space: pre-wrap;
}

.contact h3 {
  margin-bottom: 10px;
}

.comments-section {
  border-top: 1px solid #f0f0f0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.comments-title {
  padding: 12px 16px;
  margin: 0;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.comments-list {
  flex: 1;
  overflow-y: auto;
  max-height: 200px;
  padding: 12px 16px;
}

.comment-item {
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.comment-user {
  font-weight: 600;
  font-size: 13px;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-header .el-button {
  margin-left: auto;
}

.comment-content {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.no-comments {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 20px 0;
}

.comment-input {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
}

.comment-input .el-input {
  flex: 1;
}

.comment-input .el-button {
  flex-shrink: 0;
}

.comment-login-tip {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
  font-size: 13px;
  color: #999;
}

.comment-login-tip a {
  color: #409eff;
}

.loading, .not-found {
  padding: 60px 0;
}

.preview-full {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80vh;
  position: relative;
}

.preview-full img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.preview-full .arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

@media (max-width: 768px) {
  .post-detail {
    grid-template-columns: 1fr;
  }
}
</style>