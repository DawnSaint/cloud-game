import { useMainStore } from '~/stores/main';

export interface LoginResult {
  success: boolean;
  error?: string;
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
