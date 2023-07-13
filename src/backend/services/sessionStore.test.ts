import { expect } from '@jest/globals'
import { SessionStore } from './sessionStore'
import { SignonProfileData } from '../constants/types'

jest.mock('../config', () => ({
  __esModule: true,
  default: {
    ...jest.requireActual('../config').default,
    authEnabled: true,
  },
}))

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

let get: jest.Mock
let set: jest.Mock
let sadd: jest.Mock
let spop: jest.Mock
let destroy: jest.Mock
let smembers: jest.Mock

beforeAll(() => {
  get = jest.fn()
  set = jest.fn()
  sadd = jest.fn()
  spop = jest.fn()
  destroy = jest.fn()
  smembers = jest.fn()
  jest.clearAllMocks()
  jest.resetAllMocks()
  ;(
    jest.spyOn(
      SessionStore.prototype as any,
      'createRedisInstance'
    ) as jest.Mock
  ).mockImplementation(() => ({ sadd, spop, get, set, smembers }))
  ;(
    jest.spyOn(SessionStore.prototype as any, 'createSessionStore') as jest.Mock
  ).mockImplementation(() => ({ destroy }))
})

describe('[Class]: SessionStore]', () => {
  it('[Method] destroySession calls destroy on sessionStore', async () => {
    const sessionStore = new SessionStore()
    await sessionStore.destroySession('testId')
    expect(sessionStore.getStore().destroy).toHaveBeenCalledWith('testId')
  })

  it('[Method] destroySessionsForUserId', async () => {
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

  it('[Method] updateSessionPermissions', async () => {
    const sessionStore = new SessionStore()
    const oldSessionObject = {
      passport: {
        user: {
          profileData: {
            user: { permissions: { govSearch: ['permission1'] } },
          },
        },
      },
    }
    const expectedSessionKey = 'Session__testId'
    const expectedNewSessionObject = {
      passport: {
        user: {
          profileData: {
            user: { permissions: { govSearch: ['newPermission'] } },
          },
        },
      },
    }
    get.mockResolvedValueOnce(JSON.stringify(oldSessionObject))
    await sessionStore.updateSessionPermissions('testId', {
      govSearch: ['newPermission'],
    })

    expect(get).toHaveBeenCalledWith(expectedSessionKey)
    expect(set).toHaveBeenCalledWith(
      expectedSessionKey,
      JSON.stringify(expectedNewSessionObject)
    )
  })

  it('[Method] updatePermissionsForUser', async () => {
    const sessionStore = new SessionStore()
    jest.spyOn(sessionStore, 'updateSessionPermissions')
    const userId = 'testId'
    const profile = { user: { permissions: { govSearch: ['newPermission'] } } }

    smembers.mockResolvedValueOnce(['session1', 'session2'])

    await sessionStore.updatePermissionsForUser(
      userId,
      profile as unknown as SignonProfileData
    )

    expect(smembers).toHaveBeenCalledWith(`UserSessionsSet__${userId}`)
    expect(sessionStore.updateSessionPermissions).toHaveBeenNthCalledWith(
      1,
      'session1',
      profile.user.permissions
    )
    expect(sessionStore.updateSessionPermissions).toHaveBeenNthCalledWith(
      2,
      'session2',
      profile.user.permissions
    )
  })
})
