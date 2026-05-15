<template>
  <div class="login-page">
    <div class="login-card">
      <h2>{{ $t('register') }}</h2>
      <el-form :model="form" @submit.prevent="handleRegister">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.confirmPassword" type="password" placeholder="确认密码" size="large" />
        </el-form-item>
        <el-form-item>
          <div class="captcha-row">
            <el-input v-model="form.captchaCode" placeholder="图形验证码" size="large" style="flex: 1;" />
            <img :src="captchaImage" class="captcha-img" @click="refreshCaptcha" alt="验证码" />
          </div>
        </el-form-item>

        <el-divider />

        <el-form-item>
          <div class="phone-row">
            <el-select v-model="form.countryCode" filterable placeholder="国家区号" size="large" style="width: 140px;">
              <el-option
                v-for="country in countries"
                :key="country.code"
                :label="`+${country.code} ${country.name}`"
                :value="country.code"
              />
            </el-select>
            <el-input v-model="form.phone" placeholder="手机号（可选）" size="large" style="flex: 1;" />
          </div>
        </el-form-item>

        <el-form-item v-if="form.phone">
          <div class="captcha-row">
            <el-input v-model="form.phoneCode" placeholder="手机验证码" size="large" style="flex: 1;" />
            <el-button
              size="large"
              :disabled="countdown > 0"
              @click="sendCaptcha"
              class="send-btn"
            >
              {{ countdown > 0 ? `${countdown}秒` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" @click="handleRegister" style="width: 100%">
            {{ $t('register') }}
          </el-button>
        </el-form-item>
      </el-form>
      <div class="links">
        <router-link to="/login">{{ $t('login') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authApi, captchaApi } from '@/api'
import { ElMessage } from 'element-plus'

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

.el-divider {
  margin: 20px 0;
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