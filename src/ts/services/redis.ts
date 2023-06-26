import Redis from 'ioredis'

const createRedisInstance = () => {
  const redis = new Redis(
    Number(process.env.REDIS_PORT) || 6379,
    process.env.REDIS_HOST || 'localhost'
  )

  return redis
}

let redisInstance: Redis

export const getClient = () => {
  if (!redisInstance) {
    redisInstance = createRedisInstance()
  }

  return redisInstance
}
