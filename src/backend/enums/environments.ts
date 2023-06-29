export enum ENV {
  // Values should reflect the terraform variables
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export const USER_SESSION_PREFIX = 'GovSearchSession__'
export const USER_SESSIONS_SET_PREFIX = 'SessionsForUserId__'
