import log from './logging.js'
import users from './users.js'

export const requireAccessToken = (req, res, next) => {
  const { authorization } = req.headers
  const isTokenCorrectFormat =
    authorization?.startsWith('Bearer ') && authorization.length > 7
  if (!authorization || !isTokenCorrectFormat) {
    log.warn('Unauthorized - no token or incorrect format')
    return res.status(401).send('Unauthorized')
  }
  const token = authorization.split(' ')[1]
  const user = users.getUserByAccessToken(token)
  if (!user) {
    log.warn('Unauthorized - no user for this token')
    return res.status(401).send('Unauthorized - no user for this token')
  }
  log.debug({ user }, 'User authenticated with access token')
  req.user = user
  next()
}

export const requireAuthorizationCode = (req, res, next) => {
  const { code } = req.params
  const user = users.getUserByAuthorizationCode(code)
  if (!user) {
    log.warn('Unauthorized - no user for this code')
    return res.status(401).send('Unauthorized - no user for this code')
  }
  log.debug({ user }, 'User authenticated with code')
  req.user = user
  next()
}
