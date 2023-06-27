import { RequestHandler } from 'express'
import { Route } from '../enums/routes'

class CookiesController {
  public cookies: RequestHandler = (req, res, next) => {

    const acceptGoogleAnalytics = false;

    try {
      res.render('cookies.njk', {
        acceptGoogleAnalytics
      })
    } catch (e) {
      next(e)
    }
  }

  public saveCookieSettings: RequestHandler = (req, res, next) => {
    try {
      console.log('acceptGoogleAnalytics', req.body.acceptGoogleAnalytics)
      res.redirect(`${Route.cookies}`);
    } catch (e) {
      next(e)
    }
  }

}

export default CookiesController
