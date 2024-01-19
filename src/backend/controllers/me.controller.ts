import { RequestHandler } from 'express'
import { SignonProfile } from '../constants/types'

class MeController {
  public me: RequestHandler = (req, res) => {
    let profile: SignonProfile | any = {}
    if (req?.user) {
      profile = req?.user as SignonProfile
    }
    return res.json(profile?.profileData || {})
  }
}

export default MeController
