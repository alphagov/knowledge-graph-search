import passport from 'passport'
import { Router } from 'express'
import AuthController from '../controllers/AuthController'
import Routes, { Route } from '../enums/routes'

class AuthRoutes implements Routes {
  public router = Router()
  public authController = new AuthController()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.get(Route.login, passport.authenticate('oauth2'))
    this.router.get(
      Route.loginCallback,
      passport.authenticate('oauth2', { failureRedirect: '/error-callback' }),
      this.authController.loginSuccessRedirect
    )
    this.router.post(Route.reauth, this.authController.reauth)
  }
}

export default AuthRoutes
