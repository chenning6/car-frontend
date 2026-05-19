<template>
  <div class="profile-page">
    <div class="profile-card">
      <h2>{{ $t('profile') }}</h2>

      <div class="user-info" v-if="userInfo">
        <div class="info-item">
          <span class="label">{{ $t('username') }}:</span>
          <span>{{ userInfo.username }}</span>
        </div>
      </div>

      <el-divider />

      <div class="account-settings">
        <h3>{{ $t('accountSettings') }}</h3>

        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">{{ $t('nickname') }}</span>
              <span class="setting-value">{{ userInfo?.nickname || '-' }}</span>
            </div>
            <el-button size="small" @click="showNicknameDialog = true">{{ $t('edit') }}</el-button>
          </div>
        </div>

        <div class="button-group">
          <el-button @click="showPasswordDialog = true">
            {{ $t('changePassword') }}
          </el-button>
          <el-button @click="showPhoneDialog = true">
            {{ $t('changePhone') }}
          </el-button>
        </div>
      </div>

      <div class="actions">
        <el-button type="danger" @click="handleLogout">{{ $t('logout') }}</el-button>
      </div>
    </div>

    <el-dialog v-model="showNicknameDialog" :title="$t('editNickname')" width="400px">
      <el-form>
        <el-form-item :label="$t('nickname')">
          <el-input v-model="nicknameForm.nickname" :placeholder="$t('nickname')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNicknameDialog = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" @click="saveNickname" :loading="savingNickname">{{ $t('save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPasswordDialog" :title="$t('changePassword')" width="400px">
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

    <el-dialog v-model="showPhoneDialog" :title="$t('changePhone')" class="phone-dialog">
      <el-form :model="phoneForm" label-width="80px">
        <el-form-item :label="$t('countryCode')">
          <el-select v-model="phoneForm.countryCode" filterable style="width: 100%">
            <el-option
              v-for="country in translatedCountries"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { userApi, authApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const { t, locale } = useI18n()

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

const userInfo = ref<any>(null)
const saving = ref(false)

const showNicknameDialog = ref(false)
const savingNickname = ref(false)
const nicknameForm = reactive({
  nickname: '',
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
      nicknameForm.nickname = userInfo.value.nickname || ''
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

async function saveNickname() {
  savingNickname.value = true
  try {
    const res = await userApi.updateProfile({
      nickname: nicknameForm.nickname,
    })
    if (res.data?.code === 200) {
      ElMessage.success(t('profileSaved'))
      showNicknameDialog.value = false
      loadProfile()
    } else {
      ElMessage.error(res.data?.message || t('profileSaved'))
    }
  } catch (error: any) {
    ElMessage.error(error || t('profileSaved'))
  } finally {
    savingNickname.value = false
  }
}

async function changePassword() {
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    ElMessage.warning(t('fillAll'))
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning(t('passwordMismatch'))
    return
  }

  changingPwd.value = true
  try {
    const res = await userApi.changePassword(passwordForm)
    if (res.data?.code === 200) {
      ElMessage.success(t('passwordChanged'))
      showPasswordDialog.value = false
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    } else {
      ElMessage.error(res.data?.message || t('passwordError'))
    }
  } catch (error: any) {
    ElMessage.error(error || t('passwordError'))
  } finally {
    changingPwd.value = false
  }
}

async function sendCaptcha() {
  if (!phoneForm.phone) {
    ElMessage.warning(t('enterPhone'))
    return
  }

  try {
    await authApi.sendCaptcha({
      countryCode: phoneForm.countryCode,
      phone: phoneForm.phone,
      type: 3,
    })
    ElMessage.success(t('codeSent'))
    countdown.value = 60
    countdownTimer = window.setInterval(() => {
      countdown.value--
      if (countdown.value <= 0 && countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (error: any) {
    ElMessage.error(error?.message || t('sendFailed'))
  }
}

async function changePhone() {
  if (!phoneForm.phone || !phoneForm.code) {
    ElMessage.warning(t('fillPhoneCaptcha'))
    return
  }

  changingPhone.value = true
  try {
    const res = await userApi.changePhone(phoneForm)
    if (res.data?.code === 200) {
      ElMessage.success(t('phoneChanged'))
      showPhoneDialog.value = false
      phoneForm.phone = ''
      phoneForm.code = ''
    } else {
      ElMessage.error(res.data?.message || t('phoneChangeFailed'))
    }
  } catch (error: any) {
    ElMessage.error(error || t('phoneChangeFailed'))
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

.settings-list {
  margin-bottom: 20px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-size: 14px;
  color: #999;
}

.setting-value {
  font-size: 15px;
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

  :deep(.phone-dialog) {
    .el-dialog__body {
      padding: 16px 12px;
    }
    .el-form-item {
      margin-bottom: 12px;
    }
    .el-select {
      width: 100%;
    }
  }

:deep(.el-form-item__label) {
  font-weight: 500;
}

@media (max-width: 768px) {
  .profile-page {
    padding: 0 12px;
  }

  .profile-card {
    padding: 16px;
    border-radius: 12px;
  }

  .profile-card h2 {
    font-size: 20px;
    margin-bottom: 16px;
    text-align: left;
  }

  .user-info {
    text-align: left;
  }

  .account-settings h3 {
    font-size: 16px;
    margin-bottom: 16px;
    text-align: left;
  }

  :deep(.el-form) {
    .el-form-item {
      display: block;
      margin-bottom: 16px;
    }
    .el-form-item__label {
      float: none;
      text-align: left;
      margin-bottom: 8px;
    }
    .el-form-item__content {
      margin-left: 0 !important;
    }
    .el-input__wrapper {
      width: 100%;
    }
    .el-select {
      width: 100%;
    }
  }

  .button-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .button-group .el-button {
    width: 100%;
  }

  :deep(.el-dialog) {
    width: 90% !important;
    max-width: 400px;
    margin: 0 auto;
  }

  :deep(.el-dialog__body) {
    padding: 16px;
  }

  .captcha-row {
    flex-direction: column;
    width: 100%;
  }

  .captcha-row .el-input {
    width: 100%;
  }

  .captcha-row .send-btn {
    width: 100%;
  }
}
</style>