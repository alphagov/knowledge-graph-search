import { RequestHandler } from 'express'
import { destroySessionsForUserId } from '../services/redisStore'
import { Route } from '../enums/routes'

class AuthController {
  public loginSuccessRedirect: RequestHandler = (req, res) => res.redirect(Route.search)
  public reauth: RequestHandler = async (req, res) => {
    const { userId } = req.params
    try {
      await destroySessionsForUserId(userId)
    } catch (error) {
      console.error('ERROR in /reauth endpoint')
      console.error({ error })
      return res.status(200)
    }
    return res.send(
      `User logged out of GovSearch successfully. UserId = ${userId}`
    )
  }
}

export default AuthController
