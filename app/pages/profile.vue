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
              <div class="stat-divider"/>
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
            <div class="menu-item menu-item--danger" @click="handleLogout">
              <span class="menu-label">退出登录</span>
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
          <span class="form-tab" :class="{ active: formMode === 'login' }" @click="switchMode('login')">登录</span>
          <span class="form-tab" :class="{ active: formMode === 'register' }" @click="switchMode('register')">注册</span>
        </div>

        <form class="form-body" novalidate @submit.prevent="handleSubmit">
          <!-- 用户名 -->
          <div class="field">
            <label class="sr-only" :for="`${formMode}-login`">用户名</label>
            <div class="input-wrap">
              <input
                :id="`${formMode}-login`"
                v-model="form.login"
                class="form-input"
                :class="{ 'is-invalid': errors.login }"
                type="text"
                placeholder="用户名"
                autocomplete="username"
                inputmode="text"
                :disabled="loginLoading"
                :aria-invalid="errors.login ? 'true' : undefined"
                :aria-describedby="errors.login ? `${formMode}-login-error` : undefined"
                @blur="validateField('login')"
                @input="onFieldInput('login')"
              >
            </div>
            <span v-if="errors.login" :id="`${formMode}-login-error`" class="field-error">{{ errors.login }}</span>
          </div>

          <!-- 密码 -->
          <div class="field">
            <label class="sr-only" :for="`${formMode}-password`">密码</label>
            <div class="input-wrap">
              <input
                :id="`${formMode}-password`"
                v-model="form.password"
                class="form-input"
                :class="{ 'is-invalid': errors.password }"
                :type="showPassword ? 'text' : 'password'"
                placeholder="密码"
                :autocomplete="formMode === 'login' ? 'current-password' : 'new-password'"
                inputmode="text"
                :disabled="loginLoading"
                :aria-invalid="errors.password ? 'true' : undefined"
                :aria-describedby="errors.password ? `${formMode}-password-error` : undefined"
                @blur="validateField('password')"
                @input="onFieldInput('password')"
                @keyup.enter="handleSubmit"
              >
              <button
                type="button"
                class="pwd-toggle"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 12a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zm0-2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path fill="currentColor" d="M2 5.27 3.28 4 20 20.72 18.73 22l-3.1-3.1A11.6 11.6 0 0 1 12 19.5C7 19.5 2.73 16.39 1 12a11.8 11.8 0 0 1 4.13-5.04L2 5.27zM6.23 9.5A4.5 4.5 0 0 0 12 16.5c.69 0 1.35-.16 1.94-.43l-1.55-1.55A2.5 2.5 0 0 1 9.5 12c0-.2.02-.4.07-.59L6.23 9.5zM12 8.5c2.49 0 4.5 2.01 4.5 4.5 0 .35-.04.69-.12 1.02l3.05 3.05A11.8 11.8 0 0 0 23 12c-1.73-4.39-6-7.5-11-7.5-1.1 0-2.16.16-3.16.45l2.3 2.3c.27-.08.56-.13.86-.16L12 8.5z"/>
                </svg>
              </button>
            </div>
            <span v-if="errors.password" :id="`${formMode}-password-error`" class="field-error">{{ errors.password }}</span>
          </div>

          <!-- 确认密码（仅注册） -->
          <div v-if="formMode === 'register'" class="field">
            <label class="sr-only" :for="`register-confirm`">确认密码</label>
            <div class="input-wrap">
              <input
                id="register-confirm"
                v-model="form.confirm"
                class="form-input"
                :class="{ 'is-invalid': errors.confirm }"
                :type="showPassword ? 'text' : 'password'"
                placeholder="确认密码"
                autocomplete="new-password"
                inputmode="text"
                :disabled="loginLoading"
                :aria-invalid="errors.confirm ? 'true' : undefined"
                :aria-describedby="errors.confirm ? 'register-confirm-error' : undefined"
                @blur="validateField('confirm')"
                @input="onFieldInput('confirm')"
                @keyup.enter="handleSubmit"
              >
            </div>
            <span v-if="errors.confirm" id="register-confirm-error" class="field-error">{{ errors.confirm }}</span>
          </div>

          <button class="form-btn" type="submit" :disabled="!isFormValid || loginLoading">
            {{ loginLoading ? (formMode === 'login' ? '登录中...' : '注册中...') : (formMode === 'login' ? '登录' : '注册') }}
          </button>

          <!-- 开发态快捷登录：走真实 register/login 链路 -->
          <button v-if="isDev" type="button" class="dev-login-btn" :disabled="loginLoading" @click="handleDevQuickLogin">
            以测试账号登录
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMainStore } from '~/stores/main';
import { socket } from '~/composables/useSocket';
import HistoryView from '~/components/profile/HistoryView.vue';
import LobbyLogo from '~/components/LobbyLogo.vue';
import AchievementsView from '~/components/profile/AchievementsView.vue';
import { webLogin, webRegister, authErrorMessage } from '~/utils/login';
import { showToast } from '~/composables/useUI';
import { validators, validateForm } from '~/utils/validators';
import type { ValidationResult, FormField } from '~/utils/validators';

const store = useMainStore();
const route = useRoute();
const router = useRouter();

// 开发态标记：仅在 dev 环境展示快捷登录入口
const isDev = import.meta.dev;

watch(() => store.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    const redirect = route.query.redirect as string;
    if (redirect) {
      router.replace(redirect);
    }
  }
});

// 视图切换状态
type ViewType = 'profile' | 'history' | 'achievements';
const currentView = ref<ViewType>('profile');

// 登录/注册模式
const formMode = ref<'login' | 'register'>('login');
const loginLoading = ref(false);

type FieldName = 'login' | 'password' | 'confirm';

const form = reactive({
  login: '',
  password: '',
  confirm: '',
});

const errors = reactive<Record<FieldName, string>>({
  login: '',
  password: '',
  confirm: '',
});

const touched = reactive<Record<FieldName, boolean>>({
  login: false,
  password: false,
  confirm: false,
});

const showPassword = ref(false);

// 当前模式下的字段规则（注册多一个确认密码字段）
const fieldRules = computed<Record<FieldName, Array<(v: string) => ValidationResult>>>(() => {
  const loginRules = [validators.required, validators.login, validators.spacesForbidden];
  const passwordRules = [validators.required, validators.min6];

  if (formMode.value === 'register') {
    return {
      login: loginRules,
      password: passwordRules,
      confirm: [
        validators.required,
        (v: string): ValidationResult => (v === form.password ? { valid: true } : { valid: false, message: '两次输入的密码不一致' }),
      ],
    };
  }

  return {
    login: loginRules,
    password: passwordRules,
    confirm: [],
  };
});

const validateField = (name: FieldName, markTouched = true) => {
  if (markTouched) touched[name] = true;

  const rules = fieldRules.value[name];
  if (!rules.length) {
    errors[name] = '';
    return;
  }

  const result = validators.validateAll(form[name], rules);
  errors[name] = result.valid ? '' : (result.message || '校验失败');
};

// blur 后才进入"实时重校"：首次出错后输入即更新错误状态
const onFieldInput = (name: FieldName) => {
  if (touched[name]) {
    validateField(name, false);
  }
  // 密码改动后，若确认密码已校验过，需同步重校
  if (name === 'password' && touched.confirm) {
    validateField('confirm', false);
  }
};

const isFormValid = computed(() => {
  const fields: Record<string, FormField> = {};
  (Object.keys(fieldRules.value) as FieldName[]).forEach((name) => {
    const rules = fieldRules.value[name];
    if (rules.length) {
      fields[name] = { value: form[name], rules };
    }
  });
  return validateForm(fields).valid;
});

const switchMode = (mode: 'login' | 'register') => {
  if (formMode.value === mode) return;
  formMode.value = mode;
  // 切换时保留用户名，清空密码相关字段与错误
  form.password = '';
  form.confirm = '';
  errors.login = '';
  errors.password = '';
  errors.confirm = '';
  touched.login = false;
  touched.password = false;
  touched.confirm = false;
  showPassword.value = false;
};

// 提交前整表校验，返回是否通过
const validateAll = (): boolean => {
  (Object.keys(fieldRules.value) as FieldName[]).forEach((name) => {
    if (fieldRules.value[name].length) {
      validateField(name, true);
    }
  });
  return isFormValid.value;
};

// 聚焦首个出错字段
const focusFirstInvalid = () => {
  const order: FieldName[] = formMode.value === 'register'
    ? ['login', 'password', 'confirm']
    : ['login', 'password'];
  for (const name of order) {
    if (errors[name]) {
      const id = name === 'confirm' ? 'register-confirm' : `${formMode.value}-${name}`;
      document.getElementById(id)?.focus();
      break;
    }
  }
};

const handleSubmit = async () => {
  if (loginLoading.value) return;
  if (!validateAll()) {
    focusFirstInvalid();
    return;
  }
  if (formMode.value === 'login') {
    await handleLogin();
  }
  else {
    await handleRegister();
  }
};

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
  loginLoading.value = true;

  try {
    const result = await webLogin(form.login, form.password);

    if (result.success) {
      showToast({ title: '登录成功', icon: 'success', duration: 2000 });
      form.login = '';
      form.password = '';
      form.confirm = '';
      await initStats();
    }
    else {
      applyServerError(result.error, 'login');
    }
  } catch (e) {
    console.error('Login error:', e);
    showToast({ title: '登录失败，请稍后重试', icon: 'none', duration: 2000 });
  } finally {
    loginLoading.value = false;
  }
};

const handleRegister = async () => {
  loginLoading.value = true;

  try {
    const result = await webRegister({ login: form.login, password: form.password });

    if (result.success) {
      showToast({ title: '注册成功', icon: 'success', duration: 2000 });
      // 注册即自动登录；保留用户名预填到登录态以备边界情况
      const registeredLogin = form.login;
      form.password = '';
      form.confirm = '';
      formMode.value = 'login';
      form.login = registeredLogin;
      await initStats();
    }
    else {
      applyServerError(result.error, 'register');
    }
  } catch (e) {
    console.error('Register error:', e);
    showToast({ title: '注册失败，请稍后重试', icon: 'none', duration: 2000 });
  } finally {
    loginLoading.value = false;
  }
};

// 把服务端错误码映射成字段级内联错误 + toast
const applyServerError = (code: string | undefined, mode: 'login' | 'register') => {
  const message = authErrorMessage(code);

  if (mode === 'login') {
    if (code === 'loginNotExist') errors.login = message;
    else if (code === 'wrongPassword') errors.password = message;
  }
  else if (code === 'loginAlreadyExist') {
    errors.login = message;
  }

  showToast({ title: message, icon: 'none', duration: 2000 });
};

// 开发态快捷登录：登录固定测试账号（不存在则自动注册），全程走真实认证链路
const handleDevQuickLogin = async () => {
  if (loginLoading.value) return;
  loginLoading.value = true;

  try {
    const result = await store.devQuickLogin();

    if (result.success) {
      showToast({ title: '已以测试账号登录', icon: 'success', duration: 2000 });
      form.login = '';
      form.password = '';
      form.confirm = '';
      await initStats();
    }
    else {
      showToast({ title: authErrorMessage(result.error), icon: 'none', duration: 2000 });
    }
  } catch (e) {
    console.error('Dev quick login error:', e);
    showToast({ title: '登录失败，请稍后重试', icon: 'none', duration: 2000 });
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

const handleLogout = () => {
  store.logout();
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

  &--danger .menu-label {
    color: $error;
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
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

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

.field {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: $radius-medium;
  // 16px 避免 iOS 聚焦自动放大
  font-size: $font-lg;
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

  &.is-invalid {
    border-color: $error;
  }

  // 密码字段右侧需给切换按钮留位
  .input-wrap:has(.pwd-toggle) & {
    padding-right: 44px;
  }
}

.pwd-toggle {
  position: absolute;
  right: $spacing-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  color: $text-secondary;
  cursor: pointer;
  transition: opacity $transition-normal;

  &:active {
    opacity: 0.5;
  }
}

.field-error {
  font-size: $font-sm;
  color: $error;
  line-height: 1.4;
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

// 开发态快捷登录：刻意低调，避免抢主操作的视觉权重
.dev-login-btn {
  margin-top: $spacing-sm;
  height: 36px;
  background: transparent;
  color: $text-secondary;
  font-size: $font-sm;
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: $radius-medium;
  cursor: pointer;
  transition: opacity $transition-normal;

  &:active {
    opacity: 0.6;
  }

  &[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
