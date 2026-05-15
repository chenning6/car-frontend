<template>
  <div class="login-page">
    <div class="login-card">
      <div class="card-header">
        <h2>创建账号</h2>
        <p>填写信息完成注册</p>
      </div>

      <el-form :model="form" @submit.prevent="handleRegister">
        <el-form-item>
          <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="确认密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <div class="captcha-row">
            <el-input
              v-model="form.captchaCode"
              placeholder="图形验证码"
              size="large"
              :prefix-icon="CircleClose"
            />
            <img :src="captchaImage" class="captcha-img" @click="refreshCaptcha" alt="验证码" />
          </div>
        </el-form-item>

        <el-divider content-position="center">
          <span class="divider-text">可选：绑定手机号</span>
        </el-divider>

        <el-form-item>
          <div class="phone-row">
            <el-select v-model="form.countryCode" filterable placeholder="国家区号" size="large" class="country-select">
              <el-option
                v-for="country in countries"
                :key="country.code"
                :label="`+${country.code} ${country.name}`"
                :value="country.code"
              />
            </el-select>
            <el-input
              v-model="form.phone"
              placeholder="手机号（可选）"
              size="large"
              :prefix-icon="Iphone"
            />
          </div>
        </el-form-item>

        <el-form-item v-if="form.phone">
          <div class="captcha-row">
            <el-input
              v-model="form.phoneCode"
              placeholder="手机验证码"
              size="large"
              :prefix-icon="Message"
            />
            <el-button
              size="large"
              :disabled="countdown > 0"
              @click="sendCaptcha"
              class="send-btn"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" @click="handleRegister" class="login-btn">
            {{ $t('register') }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="card-footer">
        <span>已有账号？</span>
        <router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authApi, captchaApi } from '@/api'
import { ElMessage } from 'element-plus'
import { User, Lock, Iphone, Message, CircleClose } from '@element-plus/icons-vue'

const router = useRouter()

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  countryCode: '86',
  phone: '',
  phoneCode: '',
  captchaId: '',
  captchaCode: '',
})

const countries = ref<{code: string; name: string; dialCode: string}[]>([])
const captchaImage = ref('')
const loading = ref(false)
const countdown = ref(0)
let countdownTimer: number | null = null

async function loadCountries() {
  try {
    const res = await authApi.getCountries()
    if (res.data?.code === 200) {
      countries.value = res.data.data
    }
  } catch (error) {
    console.error('Failed to load countries:', error)
  }
}

async function refreshCaptcha() {
  try {
    const res = await captchaApi.get()
    if (res.data?.code === 200) {
      form.captchaId = res.data.data.captchaId
      captchaImage.value = res.data.data.image
    }
  } catch (error) {
    console.error('Failed to get captcha:', error)
  }
}

async function sendCaptcha() {
  if (!form.phone) {
    ElMessage.warning('请输入手机号')
    return
  }

  try {
    await authApi.sendCaptcha({
      countryCode: form.countryCode,
      phone: form.phone,
      type: 2
    })
    ElMessage.success('验证码已发送')
    countdown.value = 60
    countdownTimer = window.setInterval(() => {
      countdown.value--
      if (countdown.value <= 0 && countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (error: any) {
    ElMessage.error(error?.message || '发送失败')
  }
}

async function handleRegister() {
  if (!form.username || !form.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }

  if (form.password !== form.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  if (!form.captchaCode) {
    ElMessage.warning('请输入图形验证码')
    return
  }

  const hasPhone = form.phone && form.phone.length > 0
  if (hasPhone && !form.phoneCode) {
    ElMessage.warning('请输入手机验证码')
    return
  }

  loading.value = true
  try {
    const res = await authApi.register({
      username: form.username,
      password: form.password,
      phone: hasPhone ? form.phone : null,
      countryCode: hasPhone ? form.countryCode : null,
      phoneCode: hasPhone ? form.phoneCode : null,
      captchaId: hasPhone ? '' : form.captchaId,
      captchaCode: hasPhone ? '' : form.captchaCode
    })

    if (res.status === 200 || res.status === 201 || res.data?.code === 200) {
      ElMessage.success('注册成功，请登录')
      router.push('/login')
    } else {
      ElMessage.error(res.data?.message || '注册失败')
      if (!hasPhone) {
        refreshCaptcha()
        form.captchaCode = ''
      }
    }
  } catch (error: any) {
    console.error('Register error:', error)
    ElMessage.error(error || '注册失败')
    if (!hasPhone) {
      refreshCaptcha()
      form.captchaCode = ''
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshCaptcha()
  loadCountries()
})
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: -20px;
  padding: 40px 20px;
}

.login-card {
  background: #fff;
  padding: 40px;
  border-radius: 20px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.card-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.card-header p {
  color: #666;
  font-size: 14px;
}

.captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-img {
  height: 40px;
  width: 100px;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s;
}

.captcha-img:hover {
  border-color: #409eff;
  transform: scale(1.02);
}

.phone-row {
  display: flex;
  gap: 12px;
}

.country-select {
  width: 140px;
}

.send-btn {
  min-width: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
  font-weight: 500;
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
}

.send-btn:disabled {
  background: #e8e8e8;
  color: #999;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  border: none;
  border-radius: 12px;
  transition: all 0.3s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.4);
}

.card-footer {
  text-align: center;
  margin-top: 24px;
  color: #666;
  font-size: 14px;
}

.card-footer a {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
}

.card-footer a:hover {
  text-decoration: underline;
}

:deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 0 0 1px #e8e8e8 inset;
  padding: 4px 12px;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409eff inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 10px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-divider__text) {
  color: #999;
  font-size: 13px;
}

:deep(.el-divider) {
  background: #e8e8e8;
}
</style>