import express from 'express'
import bodyParser from 'body-parser'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { logReq } from './middlewares.js'
import nunjucks from 'nunjucks'

const app = express()
const PORT = 3005

nunjucks.configure('views', {
  autoescape: true,
  express: app,
})
app.set('view engine', 'njk')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(logReq)

app.get('/', (req, res) => {
  res.render('index', { message: 'test' })
})

app.get('/oauth/authorize', (req, res) => {
  const { client_id, redirect_uri } = req.query

  const callback_uri = new URL(redirect_uri)
  callback_uri.searchParams.append('code', uuidv4())

  console.log({ URL: callback_uri.href })

  res.render('authorize', { callback_uri: callback_uri.href })
})

app.get('/user.json', (req, res) => {
  res.json({ name: 'John Doe', uid: uuidv4() })
})

app.post('/oauth/access_token', (req, res) => {
  const accessToken = uuidv4()
  const refreshToken = uuidv4()

  console.log('Token generated')
  console.log({ accessToken, refreshToken })

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
    console.log({ error })
    res
      .status(error.response?.status || 500)
      .send(error.response?.data || 'An error occurred')
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
