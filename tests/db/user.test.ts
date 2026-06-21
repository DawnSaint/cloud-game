import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async (pass: string) => `hashed_${pass}`),
    compare: vi.fn(async (pass: string, hash: string) => hash === `hashed_${pass}`),
  },
}))

const mockSave = vi.fn()
const mockFindOne = vi.fn()
const mockFindOneAndUpdate = vi.fn()

class MockUserModel {
  [key: string]: any
  constructor(data: any) {
    Object.assign(this, data)
  }
  save = mockSave
}
;(MockUserModel as any).findOne = mockFindOne
;(MockUserModel as any).findOneAndUpdate = mockFindOneAndUpdate

vi.mock('../../server/db/models/user', () => ({
  UserModel: MockUserModel,
}))

const registerParams = {
  id: 'user-001',
  login: 'testuser',
  password: 'password123',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('registerUser', () => {
  it('注册成功时返回 UserWithToken，name 默认为 login', async () => {
    mockSave.mockResolvedValueOnce(undefined)

    const { registerUser } = await import('../../server/db/user')
    const result = await registerUser(registerParams)

    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.id).toBe('user-001')
      expect(result.name).toBe('testuser')
      expect(result.login).toBe('testuser')
      expect(result.avatar).toBe('servant')
      expect(result.email).toBeUndefined()
      expect(typeof result.token).toBe('string')
    }
  })

  it('登录名重复时返回 loginAlreadyExist', async () => {
    const dupError = Object.assign(new Error('duplicate key'), { code: 11000, keyValue: { login: 'testuser' } })
    mockSave.mockRejectedValueOnce(dupError)

    const { registerUser } = await import('../../server/db/user')
    const result = await registerUser(registerParams)

    expect(result).toEqual({ error: 'loginAlreadyExist' })
  })

  it('使用 bcrypt 对密码进行哈希', async () => {
    mockSave.mockResolvedValueOnce(undefined)
    const bcrypt = (await import('bcryptjs')).default

    const { registerUser } = await import('../../server/db/user')
    await registerUser(registerParams)

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12)
  })
})

describe('login', () => {
  const storedUser = {
    id: 'user-001',
    name: 'testuser',
    login: 'testuser',
    email: 'test@example.com',
    avatar: 'servant',
    password: 'hashed_password123',
    registrationDate: '2024-01-01T00:00:00.000Z',
  }

  it('使用登录名登录成功', async () => {
    mockFindOne.mockResolvedValueOnce(storedUser)

    const { login } = await import('../../server/db/user')
    const result = await login('testuser', 'password123')

    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.id).toBe('user-001')
      expect(typeof result.token).toBe('string')
    }
    expect(mockFindOne).toHaveBeenCalledWith({ login: 'testuser' })
  })

  it('使用邮箱登录成功', async () => {
    mockFindOne.mockResolvedValueOnce(storedUser)

    const { login } = await import('../../server/db/user')
    const result = await login('test@example.com', 'password123')

    expect('error' in result).toBe(false)
    expect(mockFindOne).toHaveBeenCalledWith({ email: 'test@example.com' })
  })

  it('邮箱不存在时返回 emailNotExist', async () => {
    mockFindOne.mockResolvedValueOnce(null)

    const { login } = await import('../../server/db/user')
    const result = await login('unknown@example.com', 'password123')

    expect(result).toEqual({ error: 'emailNotExist' })
  })

  it('登录名不存在时返回 loginNotExist', async () => {
    mockFindOne.mockResolvedValueOnce(null)

    const { login } = await import('../../server/db/user')
    const result = await login('unknownuser', 'password123')

    expect(result).toEqual({ error: 'loginNotExist' })
  })

  it('密码错误时返回 wrongPassword', async () => {
    mockFindOne.mockResolvedValueOnce(storedUser)

    const { login } = await import('../../server/db/user')
    const result = await login('testuser', 'wrongpassword')

    expect(result).toEqual({ error: 'wrongPassword' })
  })
})

describe('updateCredentials', () => {
  const storedUser = {
    id: 'user-001',
    name: 'testuser',
    login: 'testuser',
    email: 'test@example.com',
    avatar: 'servant',
    password: 'hashed_password123',
    registrationDate: '2024-01-01T00:00:00.000Z',
  }

  it('密码验证失败时返回 wrongPassword', async () => {
    mockFindOne.mockResolvedValueOnce(storedUser)

    const { updateCredentials } = await import('../../server/db/user')
    const result = await updateCredentials('user-001', 'wrongpassword', 'email', 'new@example.com')

    expect(result).toEqual({ error: 'wrongPassword' })
  })

  it('邮箱重复时返回 emailAlreadyExist', async () => {
    mockFindOne.mockResolvedValueOnce(storedUser)
    const dupError = Object.assign(new Error('duplicate key'), { code: 11000, keyValue: { email: 'dup@example.com' } })
    mockFindOneAndUpdate.mockRejectedValueOnce(dupError)

    const { updateCredentials } = await import('../../server/db/user')
    const result = await updateCredentials('user-001', 'password123', 'email', 'dup@example.com')

    expect(result).toEqual({ error: 'emailAlreadyExist' })
  })

  it('登录名重复时返回 loginAlreadyExist', async () => {
    mockFindOne.mockResolvedValueOnce(storedUser)
    const dupError = Object.assign(new Error('duplicate key'), { code: 11000, keyValue: { login: 'dupuser' } })
    mockFindOneAndUpdate.mockRejectedValueOnce(dupError)

    const { updateCredentials } = await import('../../server/db/user')
    const result = await updateCredentials('user-001', 'password123', 'login', 'dupuser')

    expect(result).toEqual({ error: 'loginAlreadyExist' })
  })

  it('更新密码成功时返回 true', async () => {
    mockFindOne.mockResolvedValueOnce(storedUser)
    mockFindOneAndUpdate.mockResolvedValueOnce(undefined)

    const { updateCredentials } = await import('../../server/db/user')
    const result = await updateCredentials('user-001', 'password123', 'password', 'newpass456')

    expect(result).toBe(true)
  })

  it('更新邮箱成功时返回 true', async () => {
    mockFindOne.mockResolvedValueOnce(storedUser)
    mockFindOneAndUpdate.mockResolvedValueOnce(undefined)

    const { updateCredentials } = await import('../../server/db/user')
    const result = await updateCredentials('user-001', 'password123', 'email', 'new@example.com')

    expect(result).toBe(true)
  })
})

describe('getPublicUserProfile', () => {
  it('返回公开字段（不含密码和邮箱）', async () => {
    mockFindOne.mockResolvedValueOnce({
      id: 'user-001',
      name: 'testuser',
      avatar: 'servant',
      email: 'test@example.com',
      login: 'testuser',
      password: 'hashed_password123',
      registrationDate: '2024-01-01T00:00:00.000Z',
    })

    const { getPublicUserProfile } = await import('../../server/db/user')
    const result = await getPublicUserProfile('user-001')

    expect(result).toEqual({ id: 'user-001', name: 'testuser', avatar: 'servant' })
  })

  it('用户不存在时返回 null', async () => {
    mockFindOne.mockResolvedValueOnce(null)

    const { getPublicUserProfile } = await import('../../server/db/user')
    const result = await getPublicUserProfile('nonexistent')

    expect(result).toBeNull()
  })
})
