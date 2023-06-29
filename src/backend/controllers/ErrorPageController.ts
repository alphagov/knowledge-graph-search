import { RequestHandler } from 'express'

class ErrorPageController {
  public pageNotFound: RequestHandler = (req, res, next) => {
    try {
      res.status(404).render('404.njk')
    } catch (e) {
      next(e)
    }
  }
}

export default ErrorPageController
