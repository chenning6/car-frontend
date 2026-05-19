<template>
  <div class="login-page">
    <div class="login-card">
      <div class="card-header">
        <h2>{{ $t('createAccount') }}</h2>
        <p>{{ $t('registerSubtitle') }}</p>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleRegister">
<el-form-item>
          <el-input
            v-model="form.username"
            :placeholder="$t('username')"
            size="large"
            :prefix-icon="User"
          />
          <div class="field-tip" v-if="form.username && usernameError">
            {{ usernameError }}
          </div>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="$t('password')"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
          <div class="field-tip" v-if="form.password && passwordError">
            {{ passwordError }}
          </div>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.confirmPassword"
            type="password"
            :placeholder="$t('confirmPassword')"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
          <div class="field-tip" v-if="form.confirmPassword && confirmPasswordError">
            {{ confirmPasswordError }}
          </div>
        </el-form-item>
        <el-form-item>
          <div class="captcha-row">
            <el-input
              v-model="form.captchaCode"
              :placeholder="$t('captcha')"
              size="large"
              :prefix-icon="CircleClose"
            />
            <img :src="captchaImage" class="captcha-img" @click="refreshCaptcha" alt="验证码" />
          </div>
        </el-form-item>

        <el-divider content-position="center">
          <span class="divider-text">{{ $t('bindPhone') }}</span>
        </el-divider>

        <el-form-item>
          <div class="phone-row">
            <el-select v-model="form.countryCode" filterable :placeholder="$t('countryCode')" size="large" class="country-select">
              <el-option
                v-for="country in translatedCountries"
                :key="country.code"
                :label="`+${country.code} ${country.name}`"
                :value="country.code"
              />
            </el-select>
            <el-input
              v-model="form.phone"
              :placeholder="$t('phoneOptional')"
              size="large"
              :prefix-icon="Iphone"
            />
          </div>
        </el-form-item>

        <el-form-item v-if="form.phone">
          <div class="captcha-row">
            <el-input
              v-model="form.phoneCode"
              :placeholder="$t('phoneCode')"
              size="large"
              :prefix-icon="Message"
            />
            <el-button
              size="large"
              :disabled="countdown > 0 || !form.phone"
              @click="sendCaptcha"
              class="send-btn"
            >
              {{ countdown > 0 ? `${countdown}s` : $t('getCode') }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            :loading="loading" 
            @click="handleRegister" 
            class="login-btn"
            :disabled="!isFormValid"
          >
            {{ $t('register') }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="card-footer">
        <span>{{ $t('haveAccount') }}</span>
        <router-link to="/login">{{ $t('loginNow') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'
import { authApi, captchaApi } from '@/api'
import { ElMessage } from 'element-plus'
import { User, Lock, Iphone, Message, CircleClose } from '@element-plus/icons-vue'

const router = useRouter()
const { locale } = useI18n()
const formRef = ref<FormInstance>()

const countryNameMap: Record<string, Record<string, string>> = {
  '86': { 'zh-CN': '中国', 'en': 'China', 'mn': 'Хятад' },
  '1': { 'zh-CN': '美国/加拿大', 'en': 'USA/Canada', 'mn': 'Америк/Канад' },
  '44': { 'zh-CN': '英国', 'en': 'UK', 'mn': 'Англи' },
  '49': { 'zh-CN': '德国', 'en': 'Germany', 'mn': 'Герман' },
  '33': { 'zh-CN': '法国', 'en': 'France', 'mn': 'Франц' },
  '81': { 'zh-CN': '日本', 'en': 'Japan', 'mn': 'Япон' },
  '82': { 'zh-CN': '韩国', 'en': 'Korea', 'mn': 'Солонгос' },
  '91': { 'zh-CN': '印度', 'en': 'India', 'mn': 'Энэтхэг' },
  '60': { 'zh-CN': '马来西亚', 'en': 'Malaysia', 'mn': 'Малайз' },
  '62': { 'zh-CN': '印度尼西亚', 'en': 'Indonesia', 'mn': 'Индонези' },
  '66': { 'zh-CN': '泰国', 'en': 'Thailand', 'mn': 'Тайланд' },
  '84': { 'zh-CN': '越南', 'en': 'Vietnam', 'mn': 'Вьетнам' },
  '976': { 'zh-CN': '蒙古国', 'en': 'Mongolia', 'mn': 'Монгол' },
}

const translatedCountries = computed(() => {
  return countries.value.map(c => ({
    ...c,
    name: countryNameMap[c.code]?.[locale.value] || c.name
  }))
})

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

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^\d+$/, message: '用户名不能是纯数字', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度6-20位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
  ],
}

const isFormValid = computed(() => {
  return form.username && 
    !/^\d+$/.test(form.username) && 
    form.password && 
    form.password.length >= 6 && 
    form.password === form.confirmPassword && 
    form.captchaCode
})

const usernameError = computed(() => {
  if (!form.username) return ''
  if (/^\d+$/.test(form.username)) return '用户名不能是纯数字'
  return ''
})

const passwordError = computed(() => {
  if (!form.password) return ''
  if (form.password.length > 0 && form.password.length < 6) return '密码长度至少6位'
  return ''
})

const confirmPasswordError = computed(() => {
  if (!form.confirmPassword) return ''
  if (form.password !== form.confirmPassword) return '两次输入的密码不一致'
  return ''
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

.field-tip {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
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