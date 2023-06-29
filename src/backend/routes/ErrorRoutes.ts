import { Router } from 'express'
import ErrorPageController from '../controllers/ErrorPageController'
import Routes, { Route } from '../enums/routes'

class IndexRoute implements Routes {
  public router = Router()
  public errorPageController = new ErrorPageController()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.get(Route.pageNotFound, this.errorPageController.pageNotFound)
  }
}

export default IndexRoute
