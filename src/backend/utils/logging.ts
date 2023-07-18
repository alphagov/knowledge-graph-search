import pino from 'pino'
import pinoHttp from 'pino-http'
import config from '../config'
import { getPinoOptions } from '@relaycorp/pino-cloud'
import { ENV } from '../constants/environments'

const envToLogLevelMapping = {
  [ENV.TEST]: 'silent',
  [ENV.LOCAL]: 'debug',
  [ENV.DEVELOPMENT]: 'debug',
  [ENV.STAGING]: 'debug',
  [ENV.PRODUCTION]: 'info',
}

const localOptions: pino.LoggerOptions = {
  // Disable debug logs in production
  level: envToLogLevelMapping[config.environment] || 'debug',
  // level: 'silent',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    bindings: (bindings) => {
      if (config.isLocal) {
        return {}
      }
      // Gets rid of the PID binding
      // https://getpino.io/#/docs/api?id=bindings
      return { hostname: bindings.hostname }
    },
  },
  transport: {
    target: 'pino-pretty',
    options: {
      ignore: 'pid',
    },
  },
}

const localHttpOptions = {
  ...localOptions,
  ...{
    transport: {
      target: 'pino-http-print',
      options: {
        destination: 1,
        all: true,
      },
    },
  },
}

const GCPOptions = {
  ...getPinoOptions('gcp', {
    name: 'GovSearch',
    version: config.appVersion,
  }),
  timestamp: pino.stdTimeFunctions.isoTime,
}

const logger = pino(config.isLocal || config.isTest ? localOptions : GCPOptions)

export const httpLogger = pinoHttp(
  config.isLocal || config.isTest ? localHttpOptions : GCPOptions
)

export default logger
