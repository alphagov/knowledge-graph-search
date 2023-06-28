import { RequestHandler } from 'express'
import { destroySessionForUserId } from '../services/redisStore'

class AuthController {
  public loginSuccessRedirect: RequestHandler = (req, res) => res.redirect('/')
  public reauth: RequestHandler = async (req, res) => {
    const { userId } = req.params
    try {
      await destroySessionForUserId(userId)
    } catch (error) {
      console.log('ERROR - c=in /reauth endpoint')
      console.log({ error })
      return res.status(200)
    }
    return res.send(
      `User logged out of GovSearch successfully. UserId = ${userId}`
    )
  }
}

export default AuthController
