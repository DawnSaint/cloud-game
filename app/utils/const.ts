// WebSocket 服务器地址配置
export const socketURL = process.env.NODE_ENV === 'production'
  ? 'wss://avalon-game.com/socket.io/'
  : 'ws://localhost:3000/socket.io/';

// 存储键名常量
export const userProfilePath = '__user-profile__';
export const userSettingsPath = '__user-settings__';
export const alertStoragePath = '__user-alerts__';
