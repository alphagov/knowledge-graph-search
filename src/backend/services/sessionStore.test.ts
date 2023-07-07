import { expect } from '@jest/globals'
import { SessionStore } from './sessionStore'

jest.mock('ioredis', () => {
  class RedisMock {
    private port: number
    private host: string
    constructor(port: number, host: string) {
      this.port = port
      this.host = host
    }

    on() {
      return 'void'
    }
  }
  return {
    __esModule: true,
    default: RedisMock,
  }
})

let sadd: jest.Mock
let spop: jest.Mock
let destroy: jest.Mock

beforeAll(() => {
  sadd = jest.fn()
  spop = jest.fn()
  destroy = jest.fn()
  jest.clearAllMocks()
  jest.resetAllMocks()
  ;(
    jest.spyOn(
      SessionStore.prototype as any,
      'createRedisInstance'
    ) as jest.Mock
  ).mockImplementation(() => ({ sadd, spop }))
  ;(
    jest.spyOn(SessionStore.prototype as any, 'createSessionStore') as jest.Mock
  ).mockImplementation(() => ({ destroy }))
})

describe('[Class]: SessionStore]', () => {
  it('destroySession calls destroy on sessionStore', async () => {
    const sessionStore = new SessionStore()
    await sessionStore.destroySession('testId')
    expect(sessionStore.getStore().destroy).toHaveBeenCalledWith('testId')
  })

  it('destroySessionsForUserId', async () => {
    const sessionStore = new SessionStore()
    spop.mockResolvedValueOnce('id1').mockResolvedValueOnce('id2')
    await sessionStore.destroySessionsForUserId('userTestId')
    expect(spop).toHaveBeenNthCalledWith(1, 'UserSessionsSet__userTestId')
    expect(spop).toHaveBeenNthCalledWith(2, 'UserSessionsSet__userTestId')
    expect(spop).toHaveBeenCalledTimes(3)
    expect(destroy).toHaveBeenCalledWith('id1')
    expect(destroy).toHaveBeenCalledWith('id2')
    expect(destroy).toHaveBeenCalledTimes(3)
  })
})
