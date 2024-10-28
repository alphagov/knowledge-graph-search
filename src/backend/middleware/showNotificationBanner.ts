import { RequestHandler } from 'express'

export const showNotificationBanner: RequestHandler = (req, res, next) => {
    res.locals.showNotificationBanner = true
  
  next()
}