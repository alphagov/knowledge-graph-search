import { RequestHandler } from 'express'
import {
  destroySessionsForUserId,
  updatePermissionsForUser,
} from '../services/redisStore'
import { Route } from '../constants/routes'
import log from '../utils/logging'
import { SignonProfileData } from '../constants/types'

class AuthController {
  public loginSuccessRedirect: RequestHandler = (req, res) =>
    res.redirect(Route.search)

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

  public updateUserPermissions: RequestHandler = async (req, res) => {
    const { userId } = req.params
    // Assume for now the shape of the request
    const { body } = req

    try {
      await updatePermissionsForUser(userId, body as SignonProfileData)
    } catch (error) {
      log.error('Failed updating user permissions')
      log.error(error)
      return res
        .status(500)
        .send(
          'Error updating user permissions in GovSearch. Please contact GovSearch support.'
        )
    }
    return res.status(200)
  }
}

export default AuthController
