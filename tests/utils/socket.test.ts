import { describe, expect, it, beforeEach } from 'vitest'
import { getIO, setIO } from '../../server/utils/socket'

describe('Socket.IO 单例管理', () => {
  it('未初始化时调用 getIO 应抛出错误', () => {
    // 重置单例状态
    setIO(null as any)
    expect(() => getIO()).toThrow('Socket.IO not initialized')
  })

  it('setIO 后 getIO 应返回设置的实例', () => {
    const mockIO = { id: 'mock-io-instance' } as any
    setIO(mockIO)
    const result = getIO()
    expect(result).toBe(mockIO)
  })

  it('多次调用 setIO 应覆盖之前的实例', () => {
    const mockIO1 = { id: 'first' } as any
    const mockIO2 = { id: 'second' } as any
    setIO(mockIO1)
    expect(getIO()).toBe(mockIO1)
    setIO(mockIO2)
    expect(getIO()).toBe(mockIO2)
  })
})
