import { RequestHandler } from 'express'

export const allowGoogleAnalytics: RequestHandler = (req, res, next) => {
  if (
    req.cookies.acceptAnalytics === 'true' &&
    process.env.GTM_ID &&
    process.env.GTM_AUTH
  ) {
    res.locals.allowGoogleAnalytics = true
    res.locals.GTM_ID = process.env.GTM_ID
    res.locals.GTM_AUTH = process.env.GTM_AUTH
  }
  next()
}
