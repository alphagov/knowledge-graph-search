import { RequestHandler } from 'express'
import { ENV } from '../constants/environments'
import config from '../config'

class SearchController {
  public search: RequestHandler = (req, res, next) => {
    const isIntegrationEnv = config.environment === ENV.DEVELOPMENT

    try {
      res.render('search.njk', {
        isIntegrationEnv,
      })
    } catch (e) {
      next(e)
    }
  }
}

export default SearchController
