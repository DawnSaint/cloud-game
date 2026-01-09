import axios from 'axios'
import type { User, Room, ApiResponse } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 添加请求拦截器，自动添加 userId
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId')
  if (userId) {
    config.headers['x-user-id'] = userId
  }
  return config
})

export const authApi = {
  // 登录
  login: async (username: string): Promise<User> => {
    const res = await api.post<ApiResponse<User>>('/auth/login', { username })
    if (res.data.success && res.data.data) {
      localStorage.setItem('userId', res.data.data.userId)
      localStorage.setItem('username', res.data.data.username)
      return res.data.data
    }
    throw new Error(res.data.error || '登录失败')
  }
}

export const roomApi = {
  // 获取房间列表
  getRooms: async (): Promise<Room[]> => {
    const res = await api.get<ApiResponse<Room[]>>('/room/getRoomList')
    return res.data.data || []
  },

  // 获取房间详情
  getRoomDetail: async (roomId: string): Promise<Room> => {
    const res = await api.get<ApiResponse<Room>>(`/room/${roomId}`)
    if (res.data.success && res.data.data) {
      return res.data.data
    }
    throw new Error(res.data.error || '获取房间详情失败')
  },

  // 创建房间
  createRoom: async (name: string, maxPlayers: number = 10): Promise<Room> => {
    const res = await api.post<ApiResponse<Room>>('/room/create', { name, maxPlayers })
    if (res.data.success && res.data.data) {
      return res.data.data
    }
    throw new Error(res.data.error || '创建房间失败')
  },

  // 加入房间
  joinRoom: async (roomId: string): Promise<void> => {
    const res = await api.post<ApiResponse<null>>(`/room/join`, { roomId })
    if (res.data.success) {
      return
    }
    throw new Error(res.data.error || '加入房间失败')
  }
}

export default api
