import Redis from 'ioredis'

const createRedisInstance = () => {
  const redis = new Redis(
    Number(process.env.REDIS_PORT) || 6379,
    process.env.REDIS_HOST || 'localhost'
  )

  redis.on('error', (error: Error) => {
    console.error('Redis Error')
    console.error(error)
  })

  redis.on('end', () => {
    console.warn('shutting down service due to lost Redis connection')
  })

  return redis
}

let redisInstance: Redis

export const getClient = () => {
  if (!redisInstance) {
    redisInstance = createRedisInstance()
  }

  return redisInstance
}
