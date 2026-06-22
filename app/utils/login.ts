import { useMainStore } from '~/stores/main';

export interface LoginResult {
  success: boolean;
  error?: string;
}

// 服务端认证错误码 → 中文提示。仅覆盖用户名+密码流程会出现的码；
// 未知码统一兜底。供 profile.vue 及后续改密/改登录名流程复用。
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  loginAlreadyExist: '用户名已被注册',
  loginNotExist: '用户名不存在',
  wrongPassword: '密码错误',
};

export function authErrorMessage(code?: string): string {
  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code]!;
  }
  return '操作失败，请稍后重试';
}

/**
 * Web 端登录（用户名/邮箱 + 密码）
 */
export async function webLogin(loginOrEmail: string, password: string): Promise<LoginResult> {
  try {
    const store = useMainStore();
    const result = await store.login(loginOrEmail, password);

    if (result && 'error' in result) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (e) {
    console.error('Login error:', e);
    return { success: false, error: '登录过程中发生错误' };
  }
}

/**
 * Web 端注册
 */
export async function webRegister(params: {
  login: string;
  password: string;
}): Promise<LoginResult> {
  try {
    const store = useMainStore();
    const result = await store.registerUser(params);

    if (result && 'error' in result) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (e) {
    console.error('Register error:', e);
    return { success: false, error: '注册过程中发生错误' };
  }
}
