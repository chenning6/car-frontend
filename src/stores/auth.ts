import { defineStore } from 'pinia'

interface User {
  id: number
  username: string
  email: string
  role: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
    token: localStorage.getItem('token') || null,
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.user,
  },
  
  actions: {
    setUser(user: User, token: string, remember: boolean = false) {
      this.user = user
      this.token = token
      if (remember) {
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('token', token)
      } else {
        sessionStorage.setItem('user', JSON.stringify(user))
        sessionStorage.setItem('token', token)
      }
    },
    
    login(user: User, token: string) {
      this.setUser(user, token)
    },
    
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('token')
    },
    
    init() {
      const user = localStorage.getItem('user') || sessionStorage.getItem('user')
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      if (user && token) {
        this.user = JSON.parse(user)
        this.token = token
      }
    },
  },
})