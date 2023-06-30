import { getClient } from './redis'
import RedisStore from 'connect-redis'
import { REDIS_PREFIX } from '../constants/environments'
import log from '../utils/logging'
import { SignonProfileData } from '../constants/types'
import { makeSessionSetKey } from '../utils/auth'

const createRedisStore = () => {
  const store = new RedisStore({
    client: getClient(),
    prefix: REDIS_PREFIX.SESSION,
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

export const addSessionToUserSet = async (
  userId: string,
  sessionId: string
) => {
  const redis = getClient()
  const key = makeSessionSetKey(userId)
  try {
    await redis.sadd(key, sessionId)
  } catch (error) {
    log.error(`ERROR - could not append session ${sessionId} to user ${userId}`)
    throw error
  }
  log.debug(`Session ${sessionId} appended to user ${userId}`)
}

export const destroySession = async (sessionId: string) => {
  const store = getStore()
  try {
    await store.destroy(sessionId)
  } catch (error) {
    log.error(`ERROR - could not destroy session ${sessionId}`)
    throw error
  }
  log.debug(`Session destroyed: ${sessionId}`)
}

export const destroySessionsForUserId = async (userId: string) => {
  log.debug(`Destroying sessions for user ${userId}`)
  const redis = getClient()
  const key = makeSessionSetKey(userId)
  let count = 0
  try {
    let sessionId: string | null
    while ((sessionId = await redis.spop(key))) {
      await destroySession(sessionId)
      count++
    }
  } catch (error) {
    log.error(`ERROR - could not destroy sessions for user ${userId}`)
    throw error
  }
  log.debug(`${count} sessions destroyed for user ${userId}`)
}

export const updateSessionPermissions = async (
  sessionId: string,
  newPermissions: SignonProfileData['user']['permissions']
) => {
  const redis = getClient()
  const sessionJSON = await redis.get(sessionId)
  if (!sessionJSON) {
    log.error(
      `Unexpected: no session for session ID ${sessionId} in updateSessionPermissions`
    )
    return
  }
  const sessionObj = JSON.parse(sessionJSON)
  const newSessionObj: SignonProfileData = {
    ...sessionObj,
    user: {
      ...sessionObj.user,
      permissions: newPermissions,
    },
  }
  await redis.set(sessionId, JSON.stringify(newSessionObj))
}

export const updatePermissionsForUser = async (
  userId: string,
  profile: SignonProfileData
) => {
  log.debug('Updating permissions for user')
  const redis = getClient()
  const newPermissions = profile.user.permissions
  const key = makeSessionSetKey(userId)
  let sessionId: string | null = null
  try {
    while ((sessionId = await redis.spop(key))) {
      await updateSessionPermissions(sessionId, newPermissions)
    }
  } catch (error) {
    log.error(
      { userId, newPermissions, sessionId },
      `ERROR updating sessions permissions`
    )
    throw error
  }
}
