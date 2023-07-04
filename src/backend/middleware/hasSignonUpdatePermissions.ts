import e from 'express'
import { getBearerToken } from '../utils/auth'
import { getUserProfile } from '../services/signon'

const hasSignonUpdatePermissions: e.RequestHandler = async (req, res, next) => {
  const userToken = getBearerToken(req)
  if (!userToken) {
    return res.status(401).json({ error: 'Unauthorised' })
  }

  const profile = await getUserProfile(userToken)
  const hasupdatePermissions = profile.user.permissions.includes(
    'user_update_permission'
  )
  if (!hasupdatePermissions) {
    return res.status(401).json({ error: 'Unauthorised' })
  }

  next()
}

export default hasSignonUpdatePermissions
