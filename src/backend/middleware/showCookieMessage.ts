import { RequestHandler } from 'express'

export const showCookieMessage: RequestHandler = (req, res, next) => {
  const noCookiesOrSaved =
    !req.cookies.acceptAnalytics &&
    !req.query.saved &&
    !req.cookies.cookieMessage
  const hasOnlyCookieMessageCookie =
    !req.cookies.acceptAnalytics && req.cookies.cookieMessage
  const hasOnlyAcceptAnalyticsCookie =
    req.cookies.acceptAnalytics &&
    !req.query.saved &&
    !req.cookies.cookieMessage

  if (!req.cookies.acceptAnalytics) {
    res.setHeader('set-cookie', 'cookieMessage=; max-age=0')
  }

  if (noCookiesOrSaved || hasOnlyCookieMessageCookie) {
    res.locals.showCookieMessage = true
  } else if (hasOnlyAcceptAnalyticsCookie) {
    res.locals.showCookieSuccessBanner = true
  } else {
    res.locals.showCookieSuccessBanner = false
    res.locals.showCookieMessage = false
  }

  next()
}
