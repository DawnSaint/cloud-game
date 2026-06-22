// 表单验证工具
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export const validators = {
  // 必填字段验证
  required: (value: string): ValidationResult => {
    if (value && value.trim()) {
      return { valid: true };
    }
    return { valid: false, message: '此字段为必填项' };
  },

  // 最小长度验证（6位）
  min6: (value: string): ValidationResult => {
    if (value.length >= 6) {
      return { valid: true };
    }
    return { valid: false, message: '最少需要6个字符' };
  },

  // 最小长度验证（8位）
  min8: (value: string): ValidationResult => {
    if (value.length >= 8) {
      return { valid: true };
    }
    return { valid: false, message: '最少需要8个字符' };
  },

  // 登录名验证（只允许字母、数字、下划线、点和横杠）
  login: (value: string): ValidationResult => {
    const loginRegex = /^[a-zA-Z0-9_.-]+$/;
    if (loginRegex.test(value)) {
      return { valid: true };
    }
    return { valid: false, message: '登录名只能包含字母、数字、下划线、点和横杠' };
  },

  // 禁止空格
  spacesForbidden: (value: string): ValidationResult => {
    if (/^\S+$/.test(value)) {
      return { valid: true };
    }
    return { valid: false, message: '不能包含空格' };
  },

  // 组合验证器 - 执行多个验证规则
  validateAll: (value: string, rules: Array<(val: string) => ValidationResult>): ValidationResult => {
    for (const rule of rules) {
      const result = rule(value);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  },
};

// 验证整个表单
export interface FormField {
  value: string;
  rules: Array<(val: string) => ValidationResult>;
}

export interface FormValidationResult {
  valid: boolean;
  errors: { [key: string]: string };
}

export const validateForm = (fields: { [key: string]: FormField }): FormValidationResult => {
  const errors: { [key: string]: string } = {};
  let valid = true;

  Object.keys(fields).forEach((fieldName) => {
    const field = fields[fieldName]!;
    const result = validators.validateAll(field.value, field.rules);

    if (!result.valid) {
      errors[fieldName] = result.message || '验证失败';
      valid = false;
    }
  });

  return { valid, errors };
};
