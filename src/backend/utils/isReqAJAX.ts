import * as express from 'express'
import log from '../utils/logging'

export const isReqAJAX = (req: express.Request) => {
  // This header has to be manually set in the frontend
  const headerValue = req.header('x-requested-with')
  // This can be expanded if the frontend uses new ajax tools
  // e.g "xhr" with Axios etc.
  const supportedAjaxAPIs = ['fetch']
  if (!headerValue) {
    return false
  }
  if (Array.isArray(headerValue)) {
    log.warn(
      'Having multiple values is not supported for header "X-Requested-With"'
    )
    return false
  }

  return supportedAjaxAPIs.includes(headerValue)
}
