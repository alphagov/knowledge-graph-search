import { RequestHandler } from 'express'
import { Route } from '../enums/routes'
import { setCookie } from '../utils/setCookie'

class CookiesController {
  public cookies: RequestHandler = (req, res, next) => {
    const acceptAnalytics = req.cookies.acceptAnalytics === 'true'
    const savedCookies = req.query.saved
    try {
      res.render('cookies.njk', {
        acceptAnalytics,
        savedCookies,
      })
    } catch (e) {
      next(e)
    }
  }

  public saveCookieSettings: RequestHandler = (req, res, next) => {
    const { acceptAnalytics } = req.body
    const saved = '?saved=true'
    const referer = `${req.headers.referer}`.replace(saved, '')
    const isSaved = referer.includes(Route.cookies) ? saved : ''
    try {
      if (isSaved) {
        setCookie(res, 'cookieMessage', 'false')
      }
      setCookie(res, 'acceptAnalytics', acceptAnalytics)
      res.redirect(`${referer}${isSaved}`)
    } catch (e) {
      next(e)
    }
  }

  public hideCookieSuccessBanner: RequestHandler = (req, res, next) => {
    try {
      if (req.body.hideCookieSuccessBanner) {
        setCookie(res, 'cookieMessage', 'false')
      }
      res.redirect(`${req.headers.referer}`)
    } catch (e) {
      next(e)
    }
  }
}

export default CookiesController
