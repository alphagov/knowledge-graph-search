interface PaginationOptions {
  defaultResultsPerPage: number
  options: number[]
  maxResultsBeforeScrolling: number
}

interface FrontendConfig {
  pagination: PaginationOptions
}

const config: FrontendConfig = {
  pagination: {
    defaultResultsPerPage: 20,
    options: [10, 20, 30, 50, 100],
    maxResultsBeforeScrolling: 20,
  },
}

export default config
