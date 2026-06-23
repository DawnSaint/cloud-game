import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.stubGlobal('defineNuxtRouteMiddleware', (fn: any) => fn)
vi.stubGlobal('navigateTo', vi.fn((to: any) => to))

const mockStore = { isLoggedIn: false }

vi.mock('~/stores/main', () => ({
  useMainStore: () => mockStore,
}))

describe('auth 路由守卫', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.isLoggedIn = false
  })

  it('未登录时应跳转到 /auth 并携带 redirect 参数', async () => {
    const { default: middleware } = await import('~/middleware/auth')
    const result = middleware({ fullPath: '/room' })

    expect(globalThis.navigateTo).toHaveBeenCalledWith({
      path: '/auth',
      query: { redirect: '/room' },
    })
    expect(result).toEqual({
      path: '/auth',
      query: { redirect: '/room' },
    })
  })

  it('已登录时不应跳转', async () => {
    mockStore.isLoggedIn = true
    const { default: middleware } = await import('~/middleware/auth')
    const result = middleware({ fullPath: '/room' })

    expect(globalThis.navigateTo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('未登录时 redirect 参数应保留完整路径（含查询参数）', async () => {
    const { default: middleware } = await import('~/middleware/auth')
    middleware({ fullPath: '/room?id=abc123' })

    expect(globalThis.navigateTo).toHaveBeenCalledWith({
      path: '/auth',
      query: { redirect: '/room?id=abc123' },
    })
  })
})
