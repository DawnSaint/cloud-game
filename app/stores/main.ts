import { defineStore } from 'pinia';
import { socket } from '~/composables/useSocket';
import { userProfilePath, userSettingsPath, alertStoragePath, DEV_LOGIN, DEV_PASSWORD } from '~/utils/const';
import type { UserWithToken, IUserSettings, TUserState, TAlerts, TAlertsName, Dictionary } from '~/types';
import { showToast } from '~/composables/useUI';

interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  metadata?: Record<string, unknown>;
}

interface State {
  profile: UserWithToken | null;
  users: Dictionary<TUserState>;
  settings: IUserSettings | null;
  hideSpoilers: boolean;
  connect: boolean | null;
  alerts: TAlerts;
  fontLoaded: boolean;
  achievements: Achievement[];
}

// 辅助函数：从存储中读取数据
function getStorageData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`Failed to get storage data for ${key}:`, e);
    return defaultValue;
  }
}

function setStorageData(key: string, data: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to set storage data for ${key}:`, e);
  }
}

export const useMainStore = defineStore('main', {
  state: (): State => ({
    profile: getStorageData<UserWithToken | null>(userProfilePath, null),
    users: {},
    settings: getStorageData<IUserSettings | null>(userSettingsPath, null),
    hideSpoilers: false,
    connect: null,
    alerts: getStorageData<TAlerts>(alertStoragePath, {}),
    fontLoaded: false,
    achievements: [],
  }),

  getters: {
    isLoggedIn: (state) => !!state.profile,
    token: (state) => state.profile?.token,
    userName: (state) => state.profile?.name || '',
    userAvatar: (state) => state.profile?.avatar || '',
    getAchievementName: (state) => {
      return (achievementID: string) => {
        const achievement = state.achievements.find((a) => a.id === achievementID);
        return achievement?.name || achievementID;
      };
    },
  },

  actions: {
    // 设置字体加载状态
    setFontLoaded(loaded: boolean) {
      this.fontLoaded = loaded;
    },

    // 设置成就列表
    setAchievements(achievements: Achievement[]) {
      this.achievements = achievements;
    },

    // 更新警告计数器
    updateAlertCounter(alert: TAlertsName) {
      this.alerts[alert] = (this.alerts[alert] ?? 0) + 1;
      setStorageData(alertStoragePath, this.alerts);
    },

    // 更新用户资料
    updateUserProfile(profile: UserWithToken, options?: { updateToken?: boolean }) {
      const isNewToken = options?.updateToken !== false && this.profile?.token !== profile.token;
      this.profile = profile;
      setStorageData(userProfilePath, profile);

      if (isNewToken) {
        socket.updateAuthToken();
      }
    },

    // 更新用户设置
    updateUserSettings<T extends keyof IUserSettings>(key: T, value: IUserSettings[T]) {
      if (!this.settings) {
        this.settings = {};
      }
      this.settings[key] = value;
      setStorageData(userSettingsPath, this.settings);
    },

    // 清除用户资料
    clearUserProfile() {
      this.profile = null;
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(userProfilePath);
        } catch (e) {
          console.error('Failed to clear user profile:', e);
        }
      }
    },

    // 退出登录
    logout() {
      this.clearUserProfile();
      socket.updateAuthToken();
    },

    // 更新连接状态
    updateConnectState(value: boolean) {
      this.connect = value;
    },

    // 更新隐藏剧透设置
    updateHideSpoilers(value: boolean) {
      this.hideSpoilers = value;
    },

    // 更新用户状态
    updateUsersState(uuid: string, user: TUserState) {
      this.users[uuid] = user;
    },

    // 登录
    async login(loginOrEmail: string, password: string) {
      const user = await socket.emitWithAck<UserWithToken | { error: string }>('login', loginOrEmail, password);

      if (user && !('error' in user)) {
        this.updateUserProfile(user);
      }

      return user;
    },

    // 注册用户
    async registerUser(params: { login: string; password: string }) {
      const id = crypto.randomUUID();
      const user = await socket.emitWithAck<UserWithToken | { error: string }>('registerUser', { id, ...params });

      if (user && !('error' in user)) {
        this.updateUserProfile(user);
      }

      return user;
    },

    // 开发态快捷登录：先尝试登录固定测试账号，不存在则注册。全程走真实 register/login 链路。
    async devQuickLogin(): Promise<{ success: boolean; error?: string }> {
      let result = await this.login(DEV_LOGIN, DEV_PASSWORD);

      // 账号不存在 → 注册一个
      if (result && 'error' in result && result.error === 'loginNotExist') {
        result = await this.registerUser({ login: DEV_LOGIN, password: DEV_PASSWORD });
      }

      if (result && 'error' in result) {
        return { success: false, error: result.error };
      }

      return { success: true };
    },

    // 更新用户密码
    async updateUserPassword(password: string, newPassword: string) {
      return await socket.emitWithAck('updateUserPassword', password, newPassword);
    },

    // 更新用户名
    updateUserName(name: string) {
      if (this.profile) {
        socket.emit('updateUserName', name);
        this.updateUserProfile({ ...this.profile, name }, { updateToken: false });
      }
    },

    // 更新用户邮箱
    async updateUserEmail(email: string, password: string) {
      const result = await socket.emitWithAck<boolean>('updateUserEmail', password, email);

      if (this.profile && result === true) {
        this.updateUserProfile({ ...this.profile, email }, { updateToken: false });
      }

      return result;
    },

    // 刷新用户资料
    async refreshProfile() {
      const result = await socket.emitWithAck<Partial<UserWithToken>>('getMyProfile');

      if (this.profile) {
        this.updateUserProfile({ ...this.profile, ...result }, { updateToken: false });
      }

      return result;
    },

    // 更新用户登录名
    async updateUserLogin(login: string, password: string) {
      const result = await socket.emitWithAck<boolean>('updateUserLogin', password, login);

      if (this.profile && result === true) {
        this.updateUserProfile({ ...this.profile, login }, { updateToken: false });
      }

      return result;
    },

    // 获取用户公开资料
    async getUserPublicProfile(uuid: string): Promise<TUserState> {
      if (!this.users[uuid]) {
        this.updateUsersState(uuid, { status: 'loading' });
        const eventName = 'getUserProfile';

        socket.emitWithAck(eventName, uuid).then((profile) => {
          this.updateUsersState(uuid, { status: 'ready', profile });
        });
      }

      return this.users[uuid]!;
    },
  },
});

// 监听 Socket 事件（仅客户端）
if (typeof window !== 'undefined') {
  socket.on('connect', async () => {
    const store = useMainStore();
    store.updateConnectState(true);
  });

  socket.on('disconnect', () => {
    const store = useMainStore();
    store.updateConnectState(false);
  });

  socket.on('renewJWT', () => {
    const store = useMainStore();
    store.clearUserProfile();
  });

  socket.on('achievementUnlocked', (achievementID: string) => {
    const store = useMainStore();
    const achievementName = store.getAchievementName(achievementID);
    showToast({
      title: `🎉 ${achievementName}`,
      icon: 'success',
      duration: 3000,
    });
  });

  socket.on('achievementProgress', (data: { achievementID: string; currentProgress: number; requirement: number }) => {
    const store = useMainStore();
    const achievementName = store.getAchievementName(data.achievementID);
    showToast({
      title: `${achievementName} ${data.currentProgress}/${data.requirement}`,
      icon: 'none',
      duration: 2000,
    });
  });
}
