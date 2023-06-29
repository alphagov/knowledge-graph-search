import pino from 'pino'
import pinoHttp from 'pino-http'

const pinoOptions = {
  level: 'debug',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    bindings: (bindings) => {
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

const httpTransport = {
  transport: {
    target: 'pino-http-print',
    options: {
      destination: 1,
      all: true,
    },
  },
}

const logger = pino(pinoOptions)

const httpLoggerOptions = { ...pinoOptions, ...httpTransport }
export const httpLogger = pinoHttp(httpLoggerOptions)

export default logger
