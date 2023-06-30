import { RequestHandler } from 'express'
import { destroySessionsForUserId } from '../services/redisStore'

class AuthController {
  public loginSuccessRedirect: RequestHandler = (req, res) => res.redirect('/')
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
