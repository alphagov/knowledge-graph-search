import Redis from 'ioredis'
import config from '../config'

const createRedisInstance = () => {
  const redis = new Redis(config.redisPort, config.redisHost)

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
