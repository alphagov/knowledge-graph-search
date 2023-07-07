import { RequestHandler } from 'express'
import { Route } from '../constants/routes'
import log from '../utils/logging'
import { SignonProfileData } from '../constants/types'
import sessionStore, { SessionStore } from '../services/sessionStore'

class AuthController {
  public loginSuccessRedirect: RequestHandler = (req, res) =>
    res.redirect(Route.search)

  public reauth: RequestHandler = async (req, res) => {
    const { userId } = req.params
    try {
      await (sessionStore as SessionStore).destroySessionsForUserId(userId)
    } catch (error) {
      console.error('ERROR in /reauth endpoint')
      console.error({ error })
      return res.status(200).send('OK')
    }
    return res.send(
      `User logged out of GovSearch successfully. UserId = ${userId}`
    )
  }

  public updateUserPermissions: RequestHandler = async (req, res) => {
    const { userId } = req.params
    // Assume for now the shape of the request
    const { body } = req

    const { headers, params, query } = req

    log.info(
      { headers, params, body, query },
      `Updating permissions for user ${userId}`
    )

    try {
      await (sessionStore as SessionStore).updatePermissionsForUser(
        userId,
        body as SignonProfileData
      )
      log.debug(`Updated permissions for user ${userId}`)
    } catch (error) {
      log.error('Failed updating user permissions')
      log.error(error)
      return res
        .status(500)
        .send(
          'Error updating user permissions in GovSearch. Please contact GovSearch support.'
        )
    }
    return res.status(200).send('OK')
  }
}

export default AuthController
