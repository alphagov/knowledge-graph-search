import type Redis from 'ioredis'

export const SESSION_PREFIX = 'GovSearchSession__'
export const USER_ID_TO_SESSION_MAPPING = 'UserIdToSessionMapping'
export const SESSION_TO_USER_ID_MAPPING = 'SessionToUserIdMapping'

export enum CHANNEL {
  DELETE_KEY = '__keyevent@*__:del',
  SET_KEY = '__keyevent@*__:set',
}

export const createSubscriber = () => {
  const port = Number(process.env.REDIS_PORT) || 6379
  const host = process.env.REDIS_HOST || 'localhost'
  console.log(`Creating subscriber... ${JSON.stringify({ port, host })}`)

  const subscriber = new Redis(port, host)

  console.log('Subscriber created')
  return subscriber
}

export const subscribeToEvents = (redis: Redis) => {
  subscribeToKeyDelete(redis)
  subscribeToKeyCreate(redis)

  redis.on(
    'pmessage',
    async (pattern: string, channel: string, key: string) => {
      if (pattern === CHANNEL.DELETE_KEY) {
        await onKeyDeleted(redis, pattern, channel, key)
      } else if (pattern === CHANNEL.SET_KEY) {
        await onKeyCreated(redis, pattern, channel, key)
      }
    }
  )
}

const createSessionHashes = async (
  redis: Redis,
  userId: string,
  sessionId: string
) => {
  console.log(
    `Create the session hashes for ${JSON.stringify({ userId, sessionId })}`
  )
  await redis.hset(USER_ID_TO_SESSION_MAPPING, userId, sessionId)
  await redis.hset(SESSION_TO_USER_ID_MAPPING, sessionId, userId)
  console.log(
    `Session hashes created for ${JSON.stringify({ userId, sessionId })}`
  )
}

const deleteSessionHashes = async (
  redis: Redis,
  userId: string,
  sessionId: string
) => {
  console.log(
    `Create the session hashes for ${JSON.stringify({ userId, sessionId })}`
  )
  await redis.hdel(USER_ID_TO_SESSION_MAPPING, userId)
  await redis.hdel(SESSION_TO_USER_ID_MAPPING, sessionId)
  console.log(
    `Session hashes deleted for ${JSON.stringify({ userId, sessionId })}`
  )
}

const subscribeToKeyDelete = (redis: Redis) => {
  redis.psubscribe(CHANNEL.DELETE_KEY, (err, count) => {
    if (err) {
      console.error('Error subscribing to key deletion events:', err)
      return
    }
    console.log(`Subscribed to ${count} key deletion events`)
  })
}

const subscribeToKeyCreate = (redis: Redis) => {
  redis.psubscribe(CHANNEL.SET_KEY, (err, count) => {
    if (err) {
      console.error('Error subscribing to key creation events:', err)
      return
    }
    console.log(`Subscribed to ${count} key creation events`)
  })
}

const onKeyCreated = async (
  redis: Redis,
  pattern: string,
  channel: string,
  key: string
) => {
  /**
   * Creates the hashes for the session that's been deleted
   */
  console.log(`Intercepted key creation event ${{ pattern, channel, key }}`)
  const isSessionKey = key.startsWith(SESSION_PREFIX)
  if (!isSessionKey) {
    return
  }

  const value = await redis.get(key)
  const sessionId = key.split(SESSION_PREFIX)[1]
  const { uid: userId } = value?.user?.profile?.user || {}
  if (!userId) {
    console.error('ERROR  -  cannot find user ID inside session cookie', {
      key,
      sessionValue: value,
    })
    return
  }
  try {
    await createSessionHashes(redis, userId, sessionId)
  } catch (error) {
    console.error(
      `ERROR  -  Could not create session hashes for ${JSON.stringify({
        userId,
        sessionId,
      })}`
    )
    console.error(error)
  }
}

const onKeyDeleted = async (
  redis: Redis,
  pattern: string,
  channel: string,
  key: string
) => {
  /**
   * Deletes the hashes for the session that's been deleted
   */
  console.log(`Intercepted key deletion event ${{ pattern, channel, key }}`)
  const isSessionKey = key.startsWith(SESSION_PREFIX)
  if (!isSessionKey) {
    return
  }
  const sessionId = key.split(SESSION_PREFIX)[1]
  const userId = await redis.hget(SESSION_TO_USER_ID_MAPPING, sessionId)
  try {
    await deleteSessionHashes(redis, userId, sessionId)
  } catch (error) {
    console.error(
      `ERROR  -  Could not delete session hashes for ${JSON.stringify({
        userId,
        sessionId,
      })}`
    )
    console.error(error)
  }
}
