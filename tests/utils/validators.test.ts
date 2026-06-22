import { describe, expect, it } from 'vitest'
import { validators, validateForm } from '~/utils/validators'

describe('validators.required', () => {
  it('should pass for non-empty string', () => {
    expect(validators.required('hello')).toEqual({ valid: true })
  })

  it('should fail for empty string', () => {
    expect(validators.required('')).toEqual({ valid: false, message: '此字段为必填项' })
  })

  it('should fail for whitespace-only string', () => {
    expect(validators.required('   ')).toEqual({ valid: false, message: '此字段为必填项' })
  })
})

describe('validators.min6', () => {
  it('should pass for 6+ chars', () => {
    expect(validators.min6('123456')).toEqual({ valid: true })
  })

  it('should fail for less than 6 chars', () => {
    expect(validators.min6('12345')).toEqual({ valid: false, message: '最少需要6个字符' })
  })
})

describe('validators.min8', () => {
  it('should pass for 8+ chars', () => {
    expect(validators.min8('12345678')).toEqual({ valid: true })
  })

  it('should fail for less than 8 chars', () => {
    expect(validators.min8('1234567')).toEqual({ valid: false, message: '最少需要8个字符' })
  })
})

describe('validators.login', () => {
  it('should pass for alphanumeric with dots, underscores, hyphens', () => {
    expect(validators.login('user.name_01-test')).toEqual({ valid: true })
  })

  it('should fail for strings with spaces', () => {
    expect(validators.login('user name')).toEqual({
      valid: false,
      message: '登录名只能包含字母、数字、下划线、点和横杠',
    })
  })

  it('should fail for strings with special chars', () => {
    expect(validators.login('user@name')).toEqual({
      valid: false,
      message: '登录名只能包含字母、数字、下划线、点和横杠',
    })
  })
})

describe('validators.spacesForbidden', () => {
  it('should pass for strings without spaces', () => {
    expect(validators.spacesForbidden('nospace')).toEqual({ valid: true })
  })

  it('should fail for strings with spaces', () => {
    expect(validators.spacesForbidden('has space')).toEqual({ valid: false, message: '不能包含空格' })
  })
})

describe('validators.validateAll', () => {
  it('should pass when all rules pass', () => {
    const result = validators.validateAll('validUser', [
      validators.required,
      validators.login,
    ])
    expect(result).toEqual({ valid: true })
  })

  it('should return first failure', () => {
    const result = validators.validateAll('', [
      validators.required,
      validators.login,
    ])
    expect(result).toEqual({ valid: false, message: '此字段为必填项' })
  })
})

describe('validateForm', () => {
  it('should pass when all fields are valid', () => {
    const result = validateForm({
      username: { value: 'testuser', rules: [validators.required, validators.login] },
      password: { value: '12345678', rules: [validators.required, validators.min8] },
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('should collect errors from invalid fields', () => {
    const result = validateForm({
      username: { value: '', rules: [validators.required] },
      password: { value: '123', rules: [validators.required, validators.min8] },
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual({
      username: '此字段为必填项',
      password: '最少需要8个字符',
    })
  })
})
