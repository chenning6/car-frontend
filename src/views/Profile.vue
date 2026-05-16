<template>
  <div class="profile-page">
    <div class="profile-card">
      <h2>{{ $t('profile') }}</h2>

      <div class="user-info" v-if="userInfo">
        <div class="info-item">
          <span class="label">{{ $t('username') }}:</span>
          <span>{{ userInfo.username }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ $t('email') }}:</span>
          <span>{{ userInfo.email || '-' }}</span>
        </div>
      </div>

      <el-divider />

      <div class="account-settings">
        <h3>{{ $t('accountSettings') }}</h3>

        <el-form label-width="100px" class="settings-form">
          <el-form-item :label="$t('nickname')">
            <el-input v-model="form.nickname" :placeholder="$t('nickname')" />
          </el-form-item>

          <el-form-item :label="$t('wechat')">
            <el-input v-model="form.wechat" :placeholder="$t('wechat')" />
          </el-form-item>

          <el-form-item label="">
            <div class="button-group">
              <el-button type="primary" @click="saveProfile" :loading="saving">
                {{ $t('save') }}
              </el-button>
              <el-button @click="showPasswordDialog = true">
                {{ $t('changePassword') }}
              </el-button>
              <el-button @click="showPhoneDialog = true">
                {{ $t('changePhone') }}
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <div class="actions">
        <el-button type="danger" @click="handleLogout">{{ $t('logout') }}</el-button>
      </div>
    </div>

    <el-dialog v-model="showPasswordDialog" title="$t('changePassword')" width="400px">
      <el-form :model="passwordForm" label-width="80px">
        <el-form-item :label="$t('oldPassword')">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item :label="$t('newPassword')">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item :label="$t('confirmPassword')">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" @click="changePassword" :loading="changingPwd">{{ $t('save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPhoneDialog" title="$t('changePhone')" width="400px">
      <el-form :model="phoneForm" label-width="80px">
        <el-form-item :label="$t('countryCode')">
          <el-select v-model="phoneForm.countryCode" filterable style="width: 100%">
            <el-option
              v-for="country in countries"
              :key="country.code"
              :label="`+${country.code} ${country.name}`"
              :value="country.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('phone')">
          <el-input v-model="phoneForm.phone" />
        </el-form-item>
        <el-form-item :label="$t('captcha')">
          <div class="captcha-row">
            <el-input v-model="phoneForm.code" style="flex: 1" />
            <el-button
              :disabled="countdown > 0"
              @click="sendCaptcha"
              class="send-btn"
            >
              {{ countdown > 0 ? `${countdown}s` : $t('captcha') }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPhoneDialog = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" @click="changePhone" :loading="changingPhone">{{ $t('save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { userApi, authApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const userInfo = ref<any>(null)
const saving = ref(false)

const form = reactive({
  nickname: '',
  wechat: '',
})

const showPasswordDialog = ref(false)
const changingPwd = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const showPhoneDialog = ref(false)
const changingPhone = ref(false)
const countries = ref<{code: string; name: string; dialCode: string}[]>([])
const countdown = ref(0)
let countdownTimer: number | null = null

const phoneForm = reactive({
  countryCode: '86',
  phone: '',
  code: '',
})

async function loadProfile() {
  try {
    const res = await userApi.getProfile()
    if (res.data?.code === 200) {
      userInfo.value = res.data.data
      form.nickname = userInfo.value.nickname || ''
      form.wechat = userInfo.value.wechat || ''
    }
  } catch (error) {
    console.error(error)
  }
}

async function loadCountries() {
  try {
    const res = await authApi.getCountries()
    if (res.data?.code === 200) {
      countries.value = res.data.data
    }
  } catch (error) {
    console.error(error)
  }
}

async function saveProfile() {
  saving.value = true
  try {
    const res = await userApi.updateProfile({
      nickname: form.nickname,
      wechat: form.wechat,
    })
    if (res.data?.code === 200) {
      ElMessage.success('profileSaved')
    }
  } catch (error: any) {
    ElMessage.error(error || '保存失败')
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    ElMessage.warning('请填写完整')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次密码不一致')
    return
  }

  changingPwd.value = true
  try {
    const res = await userApi.changePassword(passwordForm)
    if (res.data?.code === 200) {
      ElMessage.success('passwordChanged')
      showPasswordDialog.value = false
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    } else {
      ElMessage.error(res.data?.message || 'passwordError')
    }
  } catch (error: any) {
    ElMessage.error(error || 'passwordError')
  } finally {
    changingPwd.value = false
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
      type: 3,
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

async function changePhone() {
  if (!phoneForm.phone || !phoneForm.code) {
    ElMessage.warning('请填写手机号和验证码')
    return
  }

  changingPhone.value = true
  try {
    const res = await userApi.changePhone(phoneForm)
    if (res.data?.code === 200) {
      ElMessage.success('phoneChanged')
      showPhoneDialog.value = false
      phoneForm.phone = ''
      phoneForm.code = ''
    } else {
      ElMessage.error(res.data?.message || '更换失败')
    }
  } catch (error: any) {
    ElMessage.error(error || '更换失败')
  } finally {
    changingPhone.value = false
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  loadProfile()
  loadCountries()
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
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.profile-card h2 {
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
}

.user-info {
  margin-bottom: 16px;
}

.info-item {
  margin-bottom: 12px;
}

.info-item .label {
  font-weight: 500;
  margin-right: 8px;
  color: #333;
}

.account-settings {
  margin-top: 20px;
}

.account-settings h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
}

.settings-form {
  margin-top: 16px;
}

.button-group {
  display: flex;
  gap: 12px;
}

.button-group .el-button--primary {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  border: none;
  border-radius: 10px;
}

.button-group .el-button {
  border-radius: 10px;
}

.actions {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
}

:deep(.el-input__wrapper) {
  border-radius: 10px;
}

:deep(.el-dialog) {
  border-radius: 16px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>