<template>
  <div class="home">
    <div class="filter-bar">
      <el-radio-group v-model="carType" @change="loadPosts">
        <el-radio-button value="">{{ $t('all') }}</el-radio-button>
        <el-radio-button value="new">{{ $t('newCar') }}</el-radio-button>
        <el-radio-button value="used">{{ $t('usedCar') }}</el-radio-button>
      </el-radio-group>
      
      <el-input
        v-model="search"
        :placeholder="$t('search')"
        style="width: 200px"
        @keyup.enter="loadPosts"
      >
        <template #append>
          <el-button :icon="Search" @click="loadPosts" />
        </template>
      </el-input>
    </div>
    
    <div class="post-list" v-if="posts.length">
      <div class="post-card" v-for="post in posts" :key="post.id" @click="goDetail(post.id)">
        <div class="post-image">
          <img :src="getImageUrl(post.coverImage)" :alt="post.title" @error="fixImage" />
          <div class="car-type-badge" :class="post.carType">
            {{ post.carType === 'new' ? $t('newCar') : $t('usedCar') }}
          </div>
        </div>
        <div class="post-info">
          <h3>{{ post.title }}</h3>
          <div class="price-row">
            <span class="price">{{ formatPrice(post.price) }}</span>
            <span class="currency">{{ $t('currency') }}</span>
          </div>
          <div class="specs">
            <span class="spec-item" v-if="post.brand">
              <el-icon><Goods /></el-icon>
              {{ post.brand }} {{ post.model }}
            </span>
            <span class="spec-item" v-if="post.year">
              <el-icon><Calendar /></el-icon>
              {{ post.year }}
            </span>
            <span class="spec-item" v-if="post.mileage">
              <el-icon><Odometer /></el-icon>
              {{ post.mileage }}km
            </span>
          </div>
          <p class="desc" v-if="post.description">{{ post.description }}</p>
        </div>
      </div>
    </div>
    
    <div class="empty" v-else>
      <el-empty :description="$t('noResults')" />
    </div>
    
    <div class="pagination" v-if="total > size">
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
import { Search, Goods, Calendar, Odometer } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { postApi } from '@/api'

const { t } = useI18n()
const router = useRouter()

const carType = ref('')
const search = ref('')
const page = ref(1)
const size = ref(12)
const total = ref(0)
const posts = ref<any[]>([])
const loading = ref(false)

async function loadPosts() {
  loading.value = true
  try {
    const searchVal = search.value.trim() || undefined
    const res = await postApi.list(page.value - 1, size.value, carType.value || undefined, searchVal)
    if (res.data?.code === 200) {
      posts.value = res.data.data.content || []
      total.value = res.data.data.total || 0
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('mn-MN').format(price || 0)
}

function getImageUrl(url: string) {
  if (!url) return '/placeholder.jpg'
  if (url.startsWith('http')) return url
  // /uploads/xxx -> /api/upload/uploads/xxx
  const filename = url.split('/').pop()
  return 'http://localhost:8080/api/upload/uploads/' + filename
}

function fixImage(e: Event) {
  (e.target as HTMLImageElement).src = '/placeholder.jpg'
}

function goDetail(id: number) {
  router.push('/post/' + id)
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.home {
  padding: 0;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

.post-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.post-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #f0f0f0;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #409eff;
}

.post-image {
  position: relative;
  height: 180px;
  background: #f5f5f5;
  overflow: hidden;
}

.post-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.car-type-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
}

.car-type-badge.new {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.car-type-badge.used {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.post-info {
  padding: 16px;
}

.post-info h3 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 12px;
}

.price {
  font-size: 20px;
  font-weight: bold;
  color: #f56c6c;
}

.currency {
  font-size: 14px;
  color: #999;
}

.specs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 10px;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
}

.spec-item .el-icon {
  color: #999;
}

.desc {
  font-size: 13px;
  color: #999;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty {
  padding: 60px 0;
}

.pagination {
  margin-top: 24px;
  justify-content: center;
  display: flex;
}
</style>