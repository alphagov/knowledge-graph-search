import { RequestHandler } from 'express'
import { Route } from '../enums/routes'
import { ENV } from '../enums/environments'

class CookiesController {
  public cookies: RequestHandler = (req, res, next) => {
    const acceptAnalytics = req.cookies.acceptAnalytics === 'true';
    const savedCookies = req.query.saved;
    try {
      res.render('cookies.njk', {
        acceptAnalytics,
        savedCookies
      })
    } catch (e) {
      next(e)
    }
  }

  public saveCookieSettings: RequestHandler = (req, res, next) => {
    const { acceptAnalytics} = req.body;
    try {
      if(acceptAnalytics === 'true') {
        res.cookie('acceptAnalytics', acceptAnalytics, {
          maxAge: parseInt(process.env.COOKIE_SETTINGS_MAX_AGE || '31556952000', 10), //defaults 1 year
          sameSite: 'lax',
          httpOnly: true,
          encode: String,
          secure: process.env.NODE_ENV === ENV.PRODUCTION,
        });
      } else {
        res.setHeader('set-cookie', 'acceptAnalytics=; max-age=0');
      }
      res.redirect(`${Route.cookies}?saved=true`)
    } catch (e) {
      next(e)
    }
  }

}

export default CookiesController
