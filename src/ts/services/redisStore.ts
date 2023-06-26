import { getClient } from './redis'
import RedisStore from 'connect-redis'
import { USER_SESSION_PREFIX } from '../constants'
import type Redis from 'ioredis'

const createRedisStore = () => {
  const store = new RedisStore({
    client: getClient(),
    prefix: USER_SESSION_PREFIX,
  })

  return store
}

let redisStoreInstance: RedisStore

export const getStore = () => {
  if (!redisStoreInstance) {
    redisStoreInstance = createRedisStore()
  }

  return redisStoreInstance
}

// **
// * Below are Redis utils for managing user sessions with the redis store
// **

export class SessionNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SessionNotFound'
  }
}

export const findSessionIdForUserId = async (redis: Redis, userId: string) => {
  const allKeys = await redis.keys('*')
  const sessionKeys = allKeys.filter((k) => k.startsWith(USER_SESSION_PREFIX))
  for (const key of sessionKeys) {
    const sessionObj = (await redis.get(key)) || ''
    if (sessionObj.includes(userId)) {
      return key.split(USER_SESSION_PREFIX)[1]
    }
  }
  throw new SessionNotFoundError(`No sessionID found for user ID ${userId}`)
}

export const destroySession = async (sessionId: string) => {
  const store = getStore()
  try {
    await store.destroy(sessionId)
  } catch (error) {
    console.error(`ERROR - could not destroy session ${sessionId}`)
    throw error
  }
  console.log(`Session destroyed: ${sessionId}`)
}

export const destroySessionForUserId = async (userId: string) => {
  let sessionId
  try {
    sessionId = await findSessionIdForUserId(getClient(), userId)
  } catch (error) {
    console.error('ERROR - error looking for a session ID for user ID', {
      userId,
      error,
    })
    throw error
  }
  console.log(`Destroying session for user ID ${userId}`)
  await destroySession(sessionId)
}
