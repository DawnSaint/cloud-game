import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.stubGlobal('window', {})
vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
})

vi.mock('~/composables/useSocket', () => ({
  socket: {
    updateAuthToken: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    emitWithAck: vi.fn(),
  },
}))

vi.mock('~/composables/useUI', () => ({
  showToast: vi.fn(),
}))

import { useMainStore } from '~/stores/main'

describe('认证状态管理', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('profile 为 null 时 isLoggedIn 应为 false，token 应为 undefined', () => {
    const store = useMainStore()
    store.clearUserProfile()

    expect(store.isLoggedIn).toBe(false)
    expect(store.token).toBeUndefined()
  })

  it('profile 存在时 isLoggedIn 应为 true，token 应返回 JWT', () => {
    const store = useMainStore()
    const mockProfile = {
      id: 'test-id',
      name: 'Test',
      avatar: 'servant',
      login: 'testuser',
      token: 'jwt-token-123',
    }
    store.updateUserProfile(mockProfile)

    expect(store.isLoggedIn).toBe(true)
    expect(store.token).toBe('jwt-token-123')
  })

  it('logout 后 token 应被清除', () => {
    const store = useMainStore()
    store.updateUserProfile({
      id: 'test-id',
      name: 'Test',
      avatar: 'servant',
      login: 'testuser',
      token: 'jwt-token-123',
    })

    expect(store.token).toBe('jwt-token-123')

    store.logout()
    expect(store.token).toBeUndefined()
    expect(store.isLoggedIn).toBe(false)
  })

  it('updateUserProfile 应将 profile 持久化到 localStorage', () => {
    const store = useMainStore()
    const profile = {
      id: 'test-id',
      name: 'Test',
      avatar: 'servant',
      login: 'testuser',
      token: 'jwt-token-456',
    }
    store.updateUserProfile(profile)

    expect(localStorage.setItem).toHaveBeenCalledWith(
      '__user-profile__',
      JSON.stringify(profile),
    )
  })

  it('clearUserProfile 应从 localStorage 移除 profile', () => {
    const store = useMainStore()
    store.clearUserProfile()

    expect(localStorage.removeItem).toHaveBeenCalledWith('__user-profile__')
  })
})
