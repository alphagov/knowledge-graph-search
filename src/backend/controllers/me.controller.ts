import { RequestHandler } from 'express'
import { SignonProfile } from '../constants/types'

class MeController {
  public me: RequestHandler = (req, res, next) => {
    if (req?.user) {
      const profile = req?.user as SignonProfile
      return res.json(profile.profileData || {})
    }
    next()
  }
}

export default MeController
