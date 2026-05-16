import axios from 'axios'

const API_BASE = 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error.response?.data || error.message)
    return Promise.reject(error.response?.data || error.message)
  }
)

export const authApi = {
  login: (data: { username: string; password: string; captchaId: string; captchaCode: string }) =>
    api.post('/auth/login', data),
  register: (data: {
    username: string;
    password: string;
    email?: string;
    phone?: string;
    countryCode?: string;
    phoneCode?: string;
    captchaId?: string;
    captchaCode?: string;
  }) => api.post('/auth/register', data),
  getCountries: () => api.get('/auth/countries'),
  sendCaptcha: (data: { countryCode: string; phone: string; type: number }) =>
    api.post('/captcha/send', data),
  verifyCaptcha: (data: { countryCode: string; phone: string; code: string; type: number }) =>
    api.post('/captcha/verify', data),
}

export const captchaApi = {
  get: () => api.get('/captcha-image/get'),
}

export const postApi = {
  list: (page = 0, size = 10, carType?: string, search?: string) =>
    api.get('/posts', { params: { page, size, carType, search } }),
  myList: (page = 0, size = 10, status?: string) => 
    api.get('/posts/my', { params: { page, size, status } }),
  detail: (id: number) => 
    api.get(`/posts/${id}`),
  create: (data: any) => 
    api.post('/posts', data),
  update: (id: number, data: any) => 
    api.put(`/posts/${id}`, data),
  delete: (id: number) => 
    api.delete(`/posts/${id}`),
}

export const uploadApi = {
  upload: (formData: FormData) =>
    api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  delete: (filename: string) =>
    api.delete('/upload/image', { params: { filename } }),
}

export const commentApi = {
  list: (postId: number) =>
    api.get(`/posts/${postId}/comments`),
  create: (postId: number, content: string) =>
    api.post(`/posts/${postId}/comments`, { content }),
  delete: (id: number) =>
    api.delete(`/comments/${id}`),
}

export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: { nickname?: string; wechat?: string }) =>
    api.put('/user/profile', data),
  changePassword: (data: { oldPassword: string; newPassword: string; confirmPassword: string }) =>
    api.post('/user/password', data),
  changePhone: (data: { countryCode: string; phone: string; code: string }) =>
    api.post('/user/phone', data),
}

export default api