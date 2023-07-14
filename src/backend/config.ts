import { ENV } from './constants/environments'

interface FeatureFlags {
  authEnabled: boolean
}
const featureFlags: FeatureFlags = {
  authEnabled: process.env.ENABLE_AUTH === 'true',
}

interface AppConfig extends FeatureFlags {
  port: number
  environment: ENV
  isLocal: boolean
  isTest: boolean
  redisHost: string
  redisPort: number
  oauthAuthUrl: string
  oauthTokenUrl: string
  oauthCallbackUrl: string
  clientId: string
  clientSecret: string
  signonUrl: string
  projectId: string
  gtmId: string
  gtmAuth: string
  cookieSettingsMaxAge: string
  appVersion: string
}
const config: AppConfig = {
  port: process.env.port ? parseInt(process.env.port) : 8080,
  environment: (process.env.NODE_ENV as ENV) || ENV.LOCAL,
  isLocal: process.env.NODE_ENV === ENV.LOCAL,
  isTest: process.env.NODE_ENV === ENV.TEST,
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
  gtmId: process.env.GTM_ID || 'not set',
  gtmAuth: process.env.GTM_AUTH || 'not set',
  cookieSettingsMaxAge: process.env.COOKIE_SETTINGS_MAX_AGE || '31556952000', // defaults 1 year
  appVersion: process.env.npm_package_version || 'not set',

  ...featureFlags,
}

export default config
