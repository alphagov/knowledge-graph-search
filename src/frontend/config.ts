interface PaginationOptions {
  options: number[]
  maxResultsBeforeScrolling: number
}

interface FrontendConfig {
  pagination: PaginationOptions
}

const config: FrontendConfig = {
  pagination: {
    options: [10, 20, 100, 500],
    maxResultsBeforeScrolling: 20,
  },
}

export default config
