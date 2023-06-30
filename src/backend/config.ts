interface FeatureFlags {
  authEnabled: boolean
}
const featureFlags: FeatureFlags = {
  authEnabled: process.env.ENABLE_AUTH === 'true',
}

interface AppConfig extends FeatureFlags {
  port: number
  environment: string
  isLocal: boolean
  redisHost: string
  redisPort: number
  oauthAuthUrl: string
  oauthTokenUrl: string
  oauthCallbackUrl: string
  clientId: string
  clientSecret: string
  signonUrl: string
  projectId: string
}
const config: AppConfig = {
  port: process.env.port ? parseInt(process.env.port) : 8080,
  environment: process.env.NODE_ENV || 'local',
  isLocal: process.env.NODE_ENV === 'local' || !process.env.NODE_env,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: process.env.REDIS_PORT
    ? parseInt(process.env.REDIS_PORT, 10)
    : 6379,
  oauthAuthUrl: process.env.OAUTH_AUTH_URL || 'not set',
  oauthTokenUrl: process.env.OAUTH_TOKEN_URL || 'not set',
  oauthCallbackUrl: process.env.OAUTH_CALLBACK_URL || 'not set',
  clientId: process.env.OAUTH_ID || 'not set',
  clientSecret: process.env.OAUTH_SECRET || 'not set',
  signonUrl: process.env.SIGNON_URL || 'not set',
  projectId: process.env.PROJECT_ID || 'not set',

  ...featureFlags,
}

export default config
