<template>
  <div class="auth-page">
    <LobbyLogo />

    <div class="auth-container">
      <div class="auth-spacer" />

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
import { computed, ref, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMainStore } from '~/stores/main';
import LobbyLogo from '~/components/LobbyLogo.vue';
import { webLogin, webRegister, authErrorMessage } from '~/utils/login';
import { showToast } from '~/composables/useUI';
import { validators, validateForm } from '~/utils/validators';
import type { ValidationResult, FormField } from '~/utils/validators';

const store = useMainStore();
const route = useRoute();
const router = useRouter();

const isDev = import.meta.dev;

watch(() => store.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    const redirect = route.query.redirect as string;
    router.replace(redirect || '/');
  }
});

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

const onFieldInput = (name: FieldName) => {
  if (touched[name]) {
    validateField(name, false);
  }
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

const validateAll = (): boolean => {
  (Object.keys(fieldRules.value) as FieldName[]).forEach((name) => {
    if (fieldRules.value[name].length) {
      validateField(name, true);
    }
  });
  return isFormValid.value;
};

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

const handleLogin = async () => {
  loginLoading.value = true;

  try {
    const result = await webLogin(form.login, form.password);

    if (result.success) {
      showToast({ title: '登录成功', icon: 'success', duration: 2000 });
      form.login = '';
      form.password = '';
      form.confirm = '';
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
      const registeredLogin = form.login;
      form.password = '';
      form.confirm = '';
      formMode.value = 'login';
      form.login = registeredLogin;
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
</script>

<style scoped lang="scss">
.auth-page {
  box-sizing: border-box;
  padding: $spacing-header $spacing-lg;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

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
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.auth-spacer {
  flex: 0 0 22%;
}

.login-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  box-sizing: border-box;
  padding: 0 $spacing-xxxl;
  min-height: 0;
}

.form-tabs {
  flex: 0 0 auto;
  display: flex;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
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
  margin-bottom: -1px;

  &.active {
    color: $text-primary;
    border-bottom-color: $accent;
    font-weight: 600;
  }
}

.form-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
  margin-top: 24px;
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
  padding: 14px 0;
  border: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0;
  font-size: $font-lg;
  color: $text-primary;
  background: transparent;
  outline: none;
  transition: border-color $transition-normal;

  &:focus {
    border-bottom-color: $accent;
    border-bottom-width: 2px;
  }

  &::placeholder {
    color: $text-disabled;
  }

  &.is-invalid {
    border-bottom-color: $error;
  }

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
  margin-top: 20px;
  height: 44px;
  line-height: 44px;
  background-color: #fff;
  color: $text-primary;
  font-size: $font-lg;
  font-weight: 600;
  border: none;
  border-radius: $radius-medium;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition:
    transform $transition-fast,
    box-shadow $transition-fast;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  }

  &[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

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
