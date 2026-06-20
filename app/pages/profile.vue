<template>
  <div class="profile-page">
    <!-- 返回按钮 -->
    <div v-if="store.profile" class="profile-container">
      <span v-if="currentView !== 'profile'" class="back-button" @click="handleBack">&lsaquo;</span>

      <!-- 个人资料视图 -->
      <div v-if="currentView === 'profile'">
        <!-- 头部信息 -->
        <div class="profile-header">
          <div class="profile-info">
            <span class="profile-name">{{ store.profile.name }}</span>

            <!-- 统计信息 -->
            <div v-if="statsLoading" class="profile-stats">
              <span class="stats-loading">加载中...</span>
            </div>
            <div v-else class="profile-stats">
              <div class="stat-item">
                <span class="stat-label">评分</span>
                <span class="stat-value">{{ displayRating }}</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-label">胜率</span>
                <span class="stat-value" :class="winrateClass">{{ displayWinrate }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 功能菜单 -->
        <div class="menu-section">
          <div class="menu-list">
            <div class="menu-item" @click="handleViewHistory">
              <span class="menu-label">历史战绩</span>
              <span class="menu-arrow">&rsaquo;</span>
            </div>
            <div class="menu-item" @click="handleViewAchievements">
              <span class="menu-label">查看成就</span>
              <span class="menu-arrow">&rsaquo;</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 历史战绩视图 -->
      <HistoryView v-else-if="currentView === 'history'" />

      <!-- 成就视图 -->
      <AchievementsView v-else-if="currentView === 'achievements'" />
    </div>

    <!-- 未登录状态 - 显示登录/注册表单 -->
    <div v-else class="auth-container">
      <LobbyLogo />

      <div class="login-form">
        <div class="form-tabs">
          <span class="form-tab" :class="{ active: formMode === 'login' }" @click="formMode = 'login'">登录</span>
          <span class="form-tab" :class="{ active: formMode === 'register' }" @click="formMode = 'register'">注册</span>
        </div>

        <div v-if="formMode === 'login'" class="form-body">
          <input v-model="loginForm.login" class="form-input" placeholder="用户名或邮箱" :disabled="loginLoading" />
          <input
            v-model="loginForm.password"
            class="form-input"
            type="password"
            placeholder="密码"
            :disabled="loginLoading"
            @keyup.enter="handleLogin"
          />
          <button class="form-btn" :disabled="loginLoading" @click="handleLogin">
            {{ loginLoading ? '登录中...' : '登录' }}
          </button>
        </div>

        <div v-else class="form-body">
          <input v-model="registerForm.login" class="form-input" placeholder="用户名" :disabled="loginLoading" />
          <input v-model="registerForm.name" class="form-input" placeholder="昵称" :disabled="loginLoading" />
          <input
            v-model="registerForm.email"
            class="form-input"
            type="email"
            placeholder="邮箱"
            :disabled="loginLoading"
          />
          <input
            v-model="registerForm.password"
            class="form-input"
            type="password"
            placeholder="密码"
            :disabled="loginLoading"
          />
          <button class="form-btn" :disabled="loginLoading" @click="handleRegister">
            {{ loginLoading ? '注册中...' : '注册' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, reactive } from 'vue';
import { useMainStore } from '~/stores/main';
import { socket } from '~/composables/useSocket';
import HistoryView from '~/components/profile/HistoryView.vue';
import LobbyLogo from '~/components/LobbyLogo.vue';
import AchievementsView from '~/components/profile/AchievementsView.vue';
import { webLogin, webRegister } from '~/utils/login';
import { showToast } from '~/composables/useUI';

const store = useMainStore();

// 视图切换状态
type ViewType = 'profile' | 'history' | 'achievements';
const currentView = ref<ViewType>('profile');

// 登录/注册模式
const formMode = ref<'login' | 'register'>('login');
const loginLoading = ref(false);

const loginForm = reactive({
  login: '',
  password: '',
});

const registerForm = reactive({
  login: '',
  name: '',
  email: '',
  password: '',
});

// 统计信息相关状态
const statsLoading = ref(true);
const trueSkillRating = ref<number | null>(null);
const winrate = ref<number | null>(null);

// 获取 TrueSkill 评分
const fetchTrueSkillRating = async () => {
  if (!store.profile) return;

  try {
    const result = await socket.emitWithAck('getTrueSkillRating', store.profile.id);
    if (result.success && result.rating?.mu) {
      trueSkillRating.value = Math.round(result.rating.mu);
    }
  } catch (error) {
    console.error('Failed to fetch TrueSkill rating:', error);
  }
};

// 计算胜率
const fetchWinrate = async () => {
  if (!store.profile) return;

  try {
    const games = await socket.emitWithAck('getPlayerGames', store.profile.id);

    if (Array.isArray(games) && games.length > 0) {
      let wins = 0;
      let total = 0;

      for (const game of games) {
        if (game.result?.winner) {
          total++;
          const player = game.players.find((p: any) => p.id === store.profile?.id);
          if (player) {
            const role = player.role.toLowerCase();
            const evilRoles = ['minion', 'morgana', 'mordred', 'oberon', 'evil_lancelot'];
            const playerLoyalty = evilRoles.includes(role) ? 'evil' : 'good';

            if (game.result.winner === playerLoyalty) {
              wins++;
            }
          }
        }
      }

      if (total > 0) {
        winrate.value = (wins / total) * 100;
      }
    }
  } catch (error) {
    console.error('Failed to fetch winrate:', error);
  }
};

const displayRating = computed(() => {
  return trueSkillRating.value !== null ? trueSkillRating.value : '---';
});

const displayWinrate = computed(() => {
  return winrate.value !== null ? `${winrate.value.toFixed(2)}%` : '---';
});

const winrateClass = computed(() => {
  if (winrate.value === null) return '';
  if (winrate.value < 40) return 'winrate-low';
  if (winrate.value < 50) return 'winrate-medium';
  return 'winrate-high';
});

const initStats = async () => {
  statsLoading.value = true;
  await Promise.all([fetchTrueSkillRating(), fetchWinrate()]);
  statsLoading.value = false;
};

onMounted(() => {
  if (store.profile) {
    initStats();
  }
});

const handleLogin = async () => {
  if (!loginForm.login || !loginForm.password) {
    showToast({ title: '请填写完整的登录信息', icon: 'none' });
    return;
  }

  loginLoading.value = true;

  try {
    const result = await webLogin(loginForm.login, loginForm.password);

    if (result.success) {
      showToast({ title: '登录成功', icon: 'success', duration: 2000 });
      loginForm.login = '';
      loginForm.password = '';
      await initStats();
    } else {
      showToast({ title: result.error || '登录失败', icon: 'none', duration: 2000 });
    }
  } catch (e) {
    console.error('Login error:', e);
    showToast({ title: '登录失败', icon: 'none', duration: 2000 });
  } finally {
    loginLoading.value = false;
  }
};

const handleRegister = async () => {
  const { login, name, email, password } = registerForm;
  if (!login || !name || !email || !password) {
    showToast({ title: '请填写完整的注册信息', icon: 'none' });
    return;
  }

  loginLoading.value = true;

  try {
    const result = await webRegister({ login, name, email, password });

    if (result.success) {
      showToast({ title: '注册成功', icon: 'success', duration: 2000 });
      registerForm.login = '';
      registerForm.name = '';
      registerForm.email = '';
      registerForm.password = '';
      formMode.value = 'login';
      await initStats();
    } else {
      showToast({ title: result.error || '注册失败', icon: 'none', duration: 2000 });
    }
  } catch (e) {
    console.error('Register error:', e);
    showToast({ title: '注册失败', icon: 'none', duration: 2000 });
  } finally {
    loginLoading.value = false;
  }
};

const handleViewAchievements = () => {
  currentView.value = 'achievements';
};

const handleViewHistory = () => {
  currentView.value = 'history';
};

const handleBack = () => {
  currentView.value = 'profile';
};
</script>

<style scoped lang="scss">
.profile-page {
  box-sizing: border-box;
  padding: $spacing-header $spacing-lg;
}

.back-button {
  position: fixed;
  top: $spacing-xxxl;
  left: $spacing-xl;
  font-size: $font-xxl;
  color: $text-secondary;

  &:active {
    opacity: 0.5;
  }
}

.profile-container {
  max-width: 350px;
  margin: 0 auto;
}

.profile-header {
  background: transparent;
  border-radius: 0;
  padding: 30px 20px;
  margin-bottom: $spacing-lg;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
}

.profile-name {
  color: $text-primary;
  font-size: $font-xxl;
  font-weight: bold;
  text-align: center;
}

.profile-stats {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
  margin-top: $spacing-sm;
}

.stats-loading {
  font-size: $font-md;
  color: $text-disabled;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
}

.stat-label {
  font-size: $font-sm;
  color: $text-secondary;
}

.stat-value {
  font-size: $font-xl;
  font-weight: 600;
  color: $text-primary;
}

.stat-divider {
  width: 1px;
  height: 25px;
  background-color: rgba(0, 0, 0, 0.1);
}

.winrate-low {
  color: $error;
}

.winrate-medium {
  color: #ff9800;
}

.winrate-high {
  color: $success;
}

.menu-section {
  margin-top: $spacing-xl;
}

.menu-list {
  display: flex;
  flex-direction: column;
  background: transparent;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: $spacing-lg $spacing-md;
  background: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color $transition-normal;
  cursor: pointer;

  &:active {
    background-color: rgba(0, 0, 0, 0.02);
  }
}

.menu-label {
  flex: 1;
  font-size: $font-lg;
  color: $text-primary;
  font-weight: 500;
}

.menu-arrow {
  font-size: $font-xxl;
  color: $text-secondary;
  margin-left: $spacing-sm;
}

// 登录/注册表单
.auth-container {
  min-height: 60vh;
}

.login-form {
  margin: 24px $spacing-xxxl 0;
}

.form-tabs {
  display: flex;
  margin-bottom: 24px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.08);
}

.form-tab {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: $font-lg;
  color: $text-secondary;
  cursor: pointer;
  transition: color $transition-normal;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;

  &.active {
    color: $accent;
    border-bottom-color: $accent;
    font-weight: 600;
  }
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: $radius-medium;
  font-size: $font-md;
  color: $text-primary;
  background: $bg-card;
  outline: none;
  transition: border-color $transition-normal;

  &:focus {
    border-color: $accent;
  }

  &::placeholder {
    color: $text-disabled;
  }
}

.form-btn {
  margin-top: 8px;
  height: 44px;
  line-height: 44px;
  background-color: $accent;
  color: $text-white;
  font-size: $font-lg;
  font-weight: 600;
  border: none;
  border-radius: $radius-medium;
  cursor: pointer;
  transition: opacity $transition-normal;

  &:active {
    opacity: 0.8;
  }

  &[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
