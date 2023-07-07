import Redis from 'ioredis'
import config from '../config'
import ConnectRedis from 'connect-redis'
import log from '../utils/logging'
import { REDIS_PREFIX } from '../constants/environments'
import { SignonProfileData } from '../constants/types'
import { makeSessionKey, makeSessionSetKey } from '../utils/auth'

export class SessionNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SessionNotFound'
  }
}
export class SessionStore {
  private _redis: Redis
  private _sessionStore: ConnectRedis

  constructor() {
    this._redis = this.createRedisInstance()
    this._sessionStore = this.createSessionStore()
  }

  private createRedisInstance() {
    const redis = new Redis(config.redisPort, config.redisHost)

    redis.on('error', (error: Error) => {
      log.error('Redis Error')
      log.error(error)
    })

    redis.on('end', () => {
      log.warn('shutting down service due to lost Redis connection')
    })

    return redis
  }

  private createSessionStore() {
    const store = new ConnectRedis({
      client: this._redis,
      prefix: REDIS_PREFIX.SESSION,
    })

    return store
  }

  public getStore() {
    return this._sessionStore
  }

  public getRedisInstance() {
    return this._redis
  }

  public async addSessionToUserSet(userId: string, sessionId: string) {
    const key = makeSessionSetKey(userId)
    try {
      await this._redis.sadd(key, sessionId)
    } catch (error) {
      log.error(
        `ERROR - could not append session ${sessionId} to user ${userId}`
      )
      throw error
    }
    log.debug(`Session ${sessionId} appended to user ${userId}`)
  }

  public async destroySession(sessionId: string) {
    try {
      // Store will add the Session prefix to the sessionId automatically
      await this._sessionStore.destroy(sessionId)
    } catch (error) {
      log.error(`ERROR - could not destroy session ${sessionId}`)
      throw error
    }
    log.debug(`Session destroyed: ${sessionId}`)
  }

  public async destroySessionsForUserId(userId: string) {
    log.debug(`Destroying sessions for user ${userId}`)
    const key = makeSessionSetKey(userId)
    let count = 0
    try {
      let sessionId: string | null
      while ((sessionId = await this._redis.spop(key))) {
        await this.destroySession(sessionId)
        count++
      }
    } catch (error) {
      log.error(`ERROR - could not destroy sessions for user ${userId}`)
      throw error
    }
    log.debug(`${count} sessions destroyed for user ${userId}`)
  }

  public async updateSessionPermissions(
    sessionId: string,
    newPermissions: SignonProfileData['user']['permissions']
  ) {
    const sessionKey = makeSessionKey(sessionId)
    const sessionJSON = await this._redis.get(sessionKey)
    if (!sessionJSON) {
      log.error(
        `Unexpected: no session for session ID ${sessionId} in updateSessionPermissions`
      )
      return
    }
    const sessionObj = JSON.parse(sessionJSON)
    const newSessionObj = { ...sessionObj }
    newSessionObj.passport.user.profileData.user.permissions = newPermissions
    log.debug({ newSessionObj }, 'Updating session permissions with new object')
    await this._redis.set(sessionKey, JSON.stringify(newSessionObj))
  }

  public async updatePermissionsForUser(
    userId: string,
    profile: SignonProfileData
  ) {
    log.debug('Updating permissions for user')
    const newPermissions = profile.user.permissions
    const key = makeSessionSetKey(userId)
    let currentSessionId = ''
    try {
      const sessionIDs = await this._redis.smembers(key)
      log.debug({ sessionIDs, key })
      for (const sessionId of sessionIDs) {
        currentSessionId = sessionId
        log.debug(
          { newPermissions },
          `Updating permissions for session ${sessionId}`
        )
        await this.updateSessionPermissions(sessionId, newPermissions)
      }
    } catch (error) {
      log.error(
        { userId, newPermissions, currentSessionId },
        `ERROR updating sessions permissions`
      )
      throw error
    }
  }
}

const sessionStore = config.authEnabled ? new SessionStore() : null

export default sessionStore
