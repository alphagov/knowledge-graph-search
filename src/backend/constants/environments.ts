export enum ENV {
  // Values should reflect the terraform variables
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  LOCAL = 'local',
}

export enum REDIS_PREFIX {
  SESSION = 'Session__',
  SESSIONS_SET = 'UserSessionsSet__',
}
