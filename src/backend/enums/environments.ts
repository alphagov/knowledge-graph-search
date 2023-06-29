export enum ENV {
  // Values should reflect the terraform variables
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export enum REDIS_PREFIX {
  SESSION = 'GovSession__',
  SESSIONS_SET = 'UserSessionsSet__',
}
