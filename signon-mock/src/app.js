import express from 'express'
import bodyParser from 'body-parser'
import axios from 'axios'
import crypto from 'crypto'
import nunjucks from 'nunjucks'
import log, { httpLogger } from './logging.js'

const app = express()
const PORT = 3005
const constantUserId = '129eaae9-2d72-42ea-b012-f2f4aaa84abb'

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

  const callback_uri = new URL(redirect_uri)
  callback_uri.searchParams.append('code', crypto.randomUUID())

  log.info({ URL: callback_uri.href })

  res.render('authorize', { callback_uri: callback_uri.href })
})

app.get('/user.json', (req, res) => {
  const uid =
    process.env.SINGLE_USER === 'true' ? constantUserId : crypto.randomUUID()
  log.info(`Sending profile for user ${uid}`)
  res.json({ user: { name: 'John Doe', uid } })
})

app.post('/oauth/access_token', (req, res) => {
  const accessToken = crypto.randomUUID()
  const refreshToken = crypto.randomUUID()

  log.info({ accessToken, refreshToken }, 'Tokens generated')

  res.json({ refresh_token: refreshToken, access_token: accessToken })
})

app.get('/reauth/:userId', async (req, res) => {
  const { userId } = req.params
  try {
    const response = await axios.post(
      `http://localhost:8080/auth/gds/api/users/${userId}/reauth`
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
