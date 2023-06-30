import { RequestHandler } from 'express'
import config from '../config'

export const allowGoogleAnalytics: RequestHandler = (req, res, next) => {
  if (
    req.cookies.acceptAnalytics === 'true' &&
    config.gtmId &&
    config.gtmAuth
  ) {
    res.locals.allowGoogleAnalytics = true
    res.locals.GTM_ID = config.gtmId
    res.locals.GTM_AUTH = config.gtmAuth
  }
  next()
}
