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

const isTestEnv = () => process.env.TESTING_ENV === 'true'

function getEnableHMR() {
  if (isTestEnv()) return false
  return eval('(() => buildConfig.ENABLE_HMR)()')
}

const config: FrontendConfig = {
  // @ts-ignore
  /* global buildConfig */ // buildConfig is hardcoded by webpack at build time
  // @ts-ignore
  enableHMR: getEnableHMR(),
  pagination: {
    defaultResultsPerPage: 20,
    options: [10, 20, 50, 100, 200],
    maxResultsBeforeScrolling: 20,
  },
  featureFlags: {
    enableInfoBox: false,
  },
}

export default config
