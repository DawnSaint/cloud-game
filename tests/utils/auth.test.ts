import { describe, expect, it, beforeEach, vi } from 'vitest'
import { signJWT, verifyJWT } from '../../server/utils/auth'

describe('signJWT', () => {
  it('应返回有效的 JWT 字符串', () => {
    const token = signJWT({ userId: 'user123' })
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('生成的 token 应能被正确验证', () => {
    const token = signJWT({ userId: 'user456' })
    const payload = verifyJWT(token)
    expect(payload).not.toBeNull()
    expect(payload?.userId).toBe('user456')
  })
})

describe('verifyJWT', () => {
  it('应正确解析有效 token 中的 userId', () => {
    const token = signJWT({ userId: 'test-user' })
    const payload = verifyJWT(token)
    expect(payload).toEqual(expect.objectContaining({ userId: 'test-user' }))
  })

  it('应对无效 token 返回 null', () => {
    const payload = verifyJWT('invalid.token.string')
    expect(payload).toBeNull()
  })

  it('应对空字符串返回 null', () => {
    const payload = verifyJWT('')
    expect(payload).toBeNull()
  })

  it('应对被篡改的 token 返回 null', () => {
    const token = signJWT({ userId: 'user123' })
    const tamperedToken = token + 'tampered'
    const payload = verifyJWT(tamperedToken)
    expect(payload).toBeNull()
  })
})
