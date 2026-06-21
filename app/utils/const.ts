// Socket.IO 服务端地址（独立端口）
export const socketURL = process.env.NODE_ENV === 'production'
  ? ''
  : 'http://localhost:3200'

// 存储键名常量
export const userProfilePath = '__user-profile__'
export const userSettingsPath = '__user-settings__'
export const alertStoragePath = '__user-alerts__'
