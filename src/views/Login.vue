<template>
  <div class="login-page">
    <div class="login-card">
      <h2>{{ $t('login') }}</h2>
      <el-tabs v-model="loginType" class="login-tabs">
        <el-tab-pane label="用户名登录" name="username">
          <el-form :model="form" @submit.prevent="handleLogin">
            <el-form-item>
              <el-input v-model="form.username" :placeholder="$t('username')" size="large" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="form.password" type="password" :placeholder="$t('password')" size="large" />
            </el-form-item>
            <el-form-item>
              <div class="captcha-row">
                <el-input v-model="form.captchaCode" :placeholder="$t('captcha')" size="large" style="flex: 1;" />
                <img :src="captchaImage" class="captcha-img" @click="refreshCaptcha" alt="验证码" />
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" :loading="loading" @click="handleLogin" style="width: 100%">
                {{ $t('login') }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="手机号登录" name="phone">
          <el-form :model="phoneForm" @submit.prevent="handlePhoneLogin">
            <el-form-item>
              <div class="phone-row">
                <el-select v-model="phoneForm.countryCode" filterable placeholder="国家区号" size="large" style="width: 140px;">
                  <el-option
                    v-for="country in countries"
                    :key="country.code"
                    :label="`+${country.code} ${country.name}`"
                    :value="country.code"
                  />
                </el-select>
                <el-input v-model="phoneForm.phone" placeholder="手机号" size="large" style="flex: 1;" />
              </div>
            </el-form-item>
            <el-form-item>
              <div class="captcha-row">
                <el-input v-model="phoneForm.code" placeholder="验证码" size="large" style="flex: 1;" />
                <el-button
                  size="large"
                  :disabled="countdown > 0"
                  @click="sendCaptcha"
                  class="send-btn"
                >
                  {{ countdown > 0 ? `${countdown}秒` : '发送验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" :loading="loading" @click="handlePhoneLogin" style="width: 100%">
                {{ $t('login') }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <div class="links">
        <router-link to="/register">{{ $t('register') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authApi, captchaApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const loginType = ref('username')

const form = reactive({
  username: '',
  password: '',
  captchaId: '',
  captchaCode: '',
})

const phoneForm = reactive({
  countryCode: '86',
  phone: '',
  code: '',
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

async function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  if (!form.captchaCode) {
    ElMessage.warning('请输入验证码')
    return
  }

  loading.value = true
  try {
    const res = await authApi.login({
      username: form.username,
      password: form.password,
      captchaId: form.captchaId,
      captchaCode: form.captchaCode
    })
    if (res.data?.access) {
      authStore.login(res.data.data, res.data.access)
      ElMessage.success('登录成功')
      router.push('/')
    } else if (res.data?.code !== 200) {
      ElMessage.error(res.data?.message || '登录失败')
      refreshCaptcha()
      form.captchaCode = ''
    }
  } catch (error: any) {
    console.error('Login error:', error)
    ElMessage.error(String(error) || '登录失败')
    refreshCaptcha()
    form.captchaCode = ''
  } finally {
    loading.value = false
  }
}

async function sendCaptcha() {
  if (!phoneForm.phone) {
    ElMessage.warning('请输入手机号')
    return
  }

  try {
    await authApi.sendCaptcha({
      countryCode: phoneForm.countryCode,
      phone: phoneForm.phone,
      type: 1
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

async function handlePhoneLogin() {
  if (!phoneForm.phone || !phoneForm.code) {
    ElMessage.warning('请输入手机号和验证码')
    return
  }

  loading.value = true
  try {
    const verifyRes = await authApi.verifyCaptcha({
      countryCode: phoneForm.countryCode,
      phone: phoneForm.phone,
      code: phoneForm.code,
      type: 1
    })

    if (verifyRes.data?.success) {
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error(verifyRes.data?.message || '验证码错误')
    }
  } catch (error: any) {
    console.error('Phone login error:', error)
    ElMessage.error(String(error) || '登录失败')
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
}

.login-card {
  background: #fff;
  padding: 40px;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-card h2 {
  text-align: center;
  margin-bottom: 30px;
}

.login-tabs :deep(.el-tabs__content) {
  padding-top: 20px;
}

.phone-row {
  display: flex;
  gap: 10px;
}

.captcha-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.captcha-img {
  height: 40px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.captcha-img:hover {
  border-color: #409eff;
}

.send-btn {
  min-width: 100px;
}

.links {
  text-align: center;
  margin-top: 16px;
}

.links a {
  color: #409eff;
  text-decoration: none;
}
</style>