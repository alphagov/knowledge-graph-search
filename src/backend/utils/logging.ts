import pino from 'pino'
import pinoHttp from 'pino-http'
import config from '../config'
import { getPinoOptions } from '@relaycorp/pino-cloud'
import { ENV } from '../enums/environments'

const localOptions: pino.LoggerOptions = {
  // Disable debug logs in production
  level: config.environment === ENV.PRODUCTION ? 'info' : 'debug',
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
  level: config.environment === ENV.PRODUCTION ? 'info' : 'debug',
}

const logger = pino(config.isLocal ? localOptions : GCPOptions)

export const httpLogger = pinoHttp(
  config.isLocal ? localHttpOptions : GCPOptions
)

export default logger
