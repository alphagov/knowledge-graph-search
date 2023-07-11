import passport from 'passport'
import { Router } from 'express'
import AuthController from '../controllers/auth.controller'
import hasSignonUpdatePermissions from '../middleware/hasSignonUpdatePermissions'
import Routes, { Route } from '../constants/routes'

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
    this.router.post(
      Route.reauth,
      hasSignonUpdatePermissions,
      this.authController.reauth
    )
    this.router.put(
      Route.updateUserPermissions,
      this.authController.updateUserPermissions
    )
  }
}

export default AuthRoutes
