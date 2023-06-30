import express from 'express'
import bodyParser from 'body-parser'
import axios from 'axios'
import crypto from 'crypto'
import nunjucks from 'nunjucks'
import log, { httpLogger } from './logging.js'
import users, { ADMIN_ACCESS_TOKEN } from './users.js'
import { requireAuthorizationCode, requireAccessToken } from './middlewares.js'
import { buildNewUserProfile } from './utils.js'

const app = express()
const PORT = 3005

nunjucks.configure('views', {
  autoescape: true,
  express: app,
})
app.set('view engine', 'njk')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(httpLogger)

app.get('/', (req, res) => {
  res.render('index', { message: 'test' })
})

app.get('/oauth/authorize', (req, res) => {
  const { client_id, redirect_uri } = req.query

  const newUser = users.createUser()
  log.debug({ newUser }, 'New user created')

  const callback_uri = new URL(redirect_uri)
  callback_uri.searchParams.append('code', newUser.authorizationCode)

  log.info({ URL: callback_uri.href })

  res.render('authorize', { callback_uri: callback_uri.href })
})

app.get('/user.json', requireAccessToken, (req, res) => {
  const { user } = req
  log.debug({ user }, 'User authenticated with access token')
  res.json({ user })
})

app.post('/oauth/access_token', requireAuthorizationCode, (req, res) => {
  const { user } = req

  const accessToken = crypto.randomUUID()
  const refreshToken = crypto.randomUUID()
  const newPermissions = [...new Set([...user.permissions, 'signin'])]

  const updatedUser = users.updateUser(user.id, {
    accessToken,
    refreshToken,
    permissions: newPermissions,
  })
  log.debug({ updatedUser }, 'User updated')

  log.info({ accessToken, refreshToken }, 'Tokens generated')

  res.json({ refresh_token: refreshToken, access_token: accessToken })
})

app.get('/reauth/:userId', async (req, res) => {
  const { userId } = req.params
  log.debug('reauth')
  try {
    const response = await axios.post(
      `http://localhost:8080/auth/gds/api/users/${userId}/reauth`,
      {},
      {
        headers: {
          Authorization: `Bearer ${ADMIN_ACCESS_TOKEN}`,
        },
      }
    )
    res.json(response.data)
  } catch (error) {
    log.error({ error })
    res
      .status(error.response?.status || 500)
      .send(error.response?.data || 'An error occurred')
  }
})

app.get('/updatepermissions/:userId', async (req, res) => {
  const { userId } = req.params
  const { permission } = req.query

  const newUserProfile = buildNewUserProfile({
    uid: userId,
    permisssions: { govsearch: [permission] },
  })
  try {
    const response = await axios.put(
      `http://localhost:8080/auth/gds/api/users/${userId}`,
      newUserProfile
    )
    res.json(response.data)
  } catch (error) {
    log.error({ error })
    res
      .status(error.response?.status || 500)
      .send(error.response?.data || 'An error occurred')
  }
})

app.listen(PORT, () => {
  log.info(`🚀 Signon-Mock listening on the port ${PORT}`)
})
