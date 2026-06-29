<template>
  <div class="post-create">
    <div class="form-card">
      <h2>{{ $t('publish') }}</h2>
      <el-form :model="form" label-width="120px">
        <el-form-item :label="$t('title')">
          <el-input v-model="form.title" />
        </el-form-item>
        
        <el-form-item :label="$t('carType')">
          <el-radio-group v-model="form.carType">
            <el-radio value="new">{{ $t('newCar') }}</el-radio>
            <el-radio value="used">{{ $t('usedCar') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="$t('price')">
          <el-input-number v-model="form.price" :min="0" />
          <span class="currency-tip">（{{ $t('currency') }}）</span>
        </el-form-item>
        
        <el-form-item :label="$t('brand')">
          <el-input v-model="form.brand" />
        </el-form-item>
        
        <el-form-item :label="$t('model')">
          <el-input v-model="form.model" />
        </el-form-item>
        
        <el-form-item :label="$t('year')">
          <el-input-number v-model="form.year" :min="1990" :max="2025" />
        </el-form-item>
        
        <el-form-item :label="$t('mileage')" v-if="form.carType === 'used'">
          <el-input-number v-model="form.mileage" :min="0" />
        </el-form-item>
        
        <el-form-item :label="$t('color')">
          <el-input v-model="form.color" />
        </el-form-item>
        
        <el-form-item :label="$t('description')">
          <el-input v-model="form.description" type="textarea" :rows="4" :maxlength="500" show-word-limit />
        </el-form-item>
        
        <el-form-item :label="$t('images')">
          <div class="image-section">
            <!-- 已上传的图片列表 -->
            <div v-if="form.images.length > 0" class="uploaded-images">
              <div 
                v-for="(img, index) in form.images" 
                :key="index" 
                class="image-preview"
                :class="{ 'is-cover': img.isCover }"
              >
                <img :src="getImageUrl(img.url)" @click="previewImage(index)" @error="img.url = '/placeholder.svg'" />
                <div class="cover-tag" v-if="img.isCover">{{ $t('cover') }}</div>
                <div class="image-actions">
                  <el-button size="small" :type="img.isCover ? 'success' : 'default'" @click.stop="setCover(index)">
                    {{ img.isCover ? $t('cover') : $t('setCover') }}
                  </el-button>
                  <el-button type="danger" size="small" @click.stop="removeImage(index)">×</el-button>
                </div>
              </div>
            </div>
            
            <!-- 图片预览弹窗 -->
            <el-dialog v-model="showPreview" width="90%" :title="$t('preview')" destroy-on-close>
              <div class="preview-container">
                <img :src="previewUrl" class="preview-image" />
              </div>
            </el-dialog>
            
            <!-- 上传按钮：只在图片少于20张时显示 -->
            <el-upload
              v-if="form.images.length < 20"
              ref="uploadRef"
              :action="uploadUrl"
              :auto-upload="true"
              :multiple="true"
              :show-file-list="false"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :before-upload="beforeUpload"
              :http-request="customUpload"
              accept="image/jpeg,image/png,image/gif,image/webp"
              list-type="picture-card">
              <el-icon><Plus /></el-icon>
            </el-upload>

            <div class="upload-tip" v-if="form.images.length === 0">
              {{ $t('selectImagesTip') }}
            </div>
            <div class="upload-tip" v-else-if="form.images.length < 20">
              已上传 {{ form.images.length }} / 20 张
            </div>
            <div class="upload-tip" v-else>
              已达到 20 张上限
            </div>
          </div>
        </el-form-item>
        
        <el-form-item :label="$t('contact')">
          <el-input v-model="form.contactPhone" :placeholder="$t('phone')" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">{{ $t('submit') }}</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'
import imageCompression from 'browser-image-compression'
import { postApi } from '@/api'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const uploadRef = ref()
const isEdit = ref(false)
const editId = ref<number | null>(null)

const loading = ref(false)
const showPreview = ref(false)
const previewUrl = ref('')
const uploadUrl = '/api/upload/image'

interface UploadImage {
  url: string;
  filename: string;
  isCover: boolean;
}

const form = reactive({
  title: '',
  carType: 'new',
  price: 0,
  currency: 'CNY',
  brand: '',
  model: '',
  year: 2024,
  mileage: 0,
  fuelType: 'petrol',
  transmission: 'auto',
  color: '',
  description: '',
  contactPhone: '',
  images: [] as UploadImage[],
})

async function beforeUpload(file: any) {
  const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
  if (!isImage) {
    ElMessage.error('只能上传JPG/PNG/GIF/WEBP图片')
    return false
  }
  if (file.size / 1024 / 1024 > 20) {
    ElMessage.error('原图不能超过 20MB')
    return false
  }
  try {
    if (file.type !== 'image/gif' && file.size / 1024 > 500) {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type === 'image/png' ? 'image/webp' : file.type,
        initialQuality: 0.82,
      })
      ;(file as any)._compressed = compressed
    }
  } catch (e) {
    console.warn('前端压缩失败，上传原图:', e)
  }
  return true
}

async function customUpload(option: any) {
  const realFile: File = option.file._compressed ?? option.file
  const fd = new FormData()
  fd.append('file', realFile, option.file.name)
  try {
    const res = await axios.post(option.action, fd, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
      },
    })
    option.onSuccess(res.data, option.file)
  } catch (e: any) {
    option.onError(e, option.file)
  }
}

function handleFileChange(file: any, fileList: any[]) {
  // 这个函数会在文件选择后、上传前触发
  // el-upload会自动处理预览
}

function handleUploadSuccess(response: any, file: any) {
  try {
    let data = typeof response === 'string' ? JSON.parse(response) : response
    if (data.code === 200 && data.data) {
      form.images.push({
        url: data.data.url,
        filename: data.data.filename,
        isCover: form.images.length === 0,
      })
      ElMessage.success(t('uploadSuccess'))
    }
  } catch (e) {
    console.error('Upload error:', e)
  }
}

function handleUploadError(err: any, file: any) {
  console.error('Upload failed:', err)
  ElMessage.error('上传失败')
}

function setCover(index: number) {
  form.images.forEach((img, i) => { img.isCover = i === index })
}

function previewImage(index: number) {
  previewUrl.value = getImageUrl(form.images[index].url)
  showPreview.value = true
}

function removeImage(index: number) {
  if (form.images[index].isCover && form.images.length > 1) {
    form.images[index > 0 ? index - 1 : 1].isCover = true
  }
  form.images.splice(index, 1)
}

async function loadPost(id: number) {
  try {
    const res = await postApi.detail(id)
    if (res.data?.code === 200) {
      const data = res.data.data
      form.title = data.title || ''
      form.carType = data.carType || 'new'
      form.price = data.price || 0
      form.brand = data.brand || ''
      form.model = data.model || ''
      form.year = data.year || 2024
      form.mileage = data.mileage || 0
      form.fuelType = data.fuelType || 'petrol'
      form.transmission = data.transmission || 'auto'
      form.color = data.color || ''
      form.description = data.description || ''
      form.contactPhone = data.contactPhone || ''
      
      if (data.images && data.images.length > 0) {
        form.images = data.images.map((img: any) => {
          let rawUrl = img.imageUrl || ''
          if (rawUrl.startsWith('http')) {
            rawUrl = rawUrl.replace(/^https?:\/\/[^\/]+/, '')
          }
          if (rawUrl.startsWith('/api/upload/uploads/')) {
            rawUrl = rawUrl.replace('/api/upload', '')
          }
          return {
            url: rawUrl,
            filename: rawUrl.split('/').pop() || '',
            isCover: img.isCover || false,
          }
        })
      }
    }
  } catch (error) {
    console.error(error)
  }
}

function getImageUrl(url: string) {
  if (!url) return '/placeholder.svg'
  if (url.startsWith('http')) return url
  if (url.startsWith('data:image/')) return url
  if (url.startsWith('/api/')) return url
  if (url.startsWith('/uploads/')) return '/api/upload' + url
  return '/api' + url
}

onMounted(() => {
  const id = route.params.id
  if (id) {
    isEdit.value = true
    editId.value = Number(id)
    loadPost(editId.value)
  }
})

async function handleSubmit() {
  if (!authStore.isLoggedIn) {
    ElMessage.warning(t('loginRequired'))
    router.push('/login')
    return
  }
  if (!form.title) {
    ElMessage.warning('请填写标题')
    return
  }
  if (form.images.length === 0) {
    ElMessage.warning('请上传至少一张图片')
    return
  }
  
  loading.value = true
  try {
    const postData = {
      ...form,
      images: form.images.map((img, i) => ({
        imageUrl: img.url.replace(/^http:\/\/[\d.]+:\d+/, ''),
        isCover: img.isCover,
        sortOrder: i,
      })),
    }
    
    let res
    if (isEdit.value && editId.value) {
      res = await postApi.update(editId.value, postData)
    } else {
      res = await postApi.create(postData)
    }
    
    if (res.data?.code === 200) {
      ElMessage.success(t('submitSuccess'))
      router.push('/my-posts')
    }
  } catch (error: any) {
    ElMessage.error(error || '发布失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.post-create {
  max-width: 800px;
  margin: 0 auto;
}

.form-card {
  background: #fff;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.form-card h2 {
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
}

.currency-tip {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

.image-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.uploaded-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.image-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #eee;
  flex-shrink: 0;
  transition: all 0.3s;
}

.image-preview:hover {
  border-color: #409eff;
  transform: scale(1.02);
}

.image-preview.is-cover {
  border-color: #67c23a;
  border-width: 3px;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.image-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: space-between;
  padding: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview:hover .image-actions {
  opacity: 1;
}

.upload-tip {
  color: #999;
  font-size: 12px;
}

.preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  max-height: 70vh;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-input-number) {
  border-radius: 10px;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #e8e8e8 inset;
  padding: 4px 12px;
  transition: all 0.3s;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409eff inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}

:deep(.el-radio-group) {
  display: flex;
  gap: 16px;
}

:deep(.el-radio__label) {
  font-weight: 500;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  border: none;
  border-radius: 12px;
  height: 44px;
  font-weight: 500;
  transition: all 0.3s;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.4);
}

:deep(.el-upload--picture-card) {
  border-radius: 12px;
  border: 2px dashed #dcdfe6;
  transition: all 0.3s;
}

:deep(.el-upload--picture-card:hover) {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

@media (max-width: 768px) {
  .post-create {
    padding: 0 12px;
  }

  .form-card {
    padding: 16px;
  }

  .form-card h2 {
    font-size: 20px;
    margin-bottom: 16px;
    text-align: left;
  }

  .uploaded-images {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .image-preview {
    width: 100%;
    height: 80px;
  }

  :deep(.el-form-item) {
    display: block;
  }

  :deep(.el-form-item__label) {
    text-align: left;
    float: none;
    display: block;
    margin-bottom: 4px;
  }

  :deep(.el-form-item__content) {
    margin-left: 0 !important;
    display: block;
  }

  :deep(.el-input),
  :deep(.el-input-number),
  :deep(.el-textarea),
  :deep(.el-select) {
    width: 100%;
  }

  :deep(.el-form) {
    width: 100%;
  }

  :deep(.el-form-item) {
    display: flex;
    flex-direction: column;
  }

  :deep(.el-radio-group) {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
  }
}
</style>
