interface PaginationOptions {
  defaultResultsPerPage: number
  options: number[]
  maxResultsBeforeScrolling: number
}

interface FrontendConfig {
  enableHMR: boolean
  pagination: PaginationOptions
  featureFlags: {
    [key: string]: boolean
  }
}

const isTestEnv = () => typeof jest !== 'undefined'

const config: FrontendConfig = {
  // @ts-ignore
  // eslint-disable-next-line
  /* global buildConfig */ // buildConfig is hardcoded by webpack at build time
  // @ts-ignore
  enableHMR: !isTestEnv() && buildConfig.ENABLE_HMR,
  pagination: {
    defaultResultsPerPage: 20,
    options: [10, 20, 50, 100, 200],
    maxResultsBeforeScrolling: 20,
  },
  featureFlags: {},
}

export default config
