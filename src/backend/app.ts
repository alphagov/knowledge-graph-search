/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path'
import * as http from 'http'
import cors from 'cors'
import express from 'express'
import Routes from './enums/routes'
import * as nunjucks from 'nunjucks'
import bodyParser from 'body-parser'
import Redis from 'ioredis'
import RedisStore from 'connect-redis'
import { allowGoogleAnalytics } from './middleware/allowGoogleAnalytics'
import { showCookieMessage } from './middleware/showCookieMessage'

const OAuth2Strategy = require('passport-oauth2')
const passport = require('passport')
const session = require('express-session')
const cookieParser = require('cookie-parser')

const redisInstance = new Redis(
  Number(process.env.REDIS_PORT) || 6379,
  process.env.REDIS_HOST || 'localhost'
)

const redisStore = new RedisStore({
  client: redisInstance,
  prefix: 'GovSearch::',
})

class App {
  public app: express.Express = express()
  public port: string | number

  constructor(routes: Routes[]) {
    this.app = express()
    this.port = process.env.port ? parseInt(process.env.port) : 8080

    this.initializeMiddlewares()
    this.initializeRoutes(routes)
    this.initializeRenderEngine()
  }

  public listen(): void {
    const server = http.createServer(this.app)
    server.keepAliveTimeout = 1000 * (60 * 6) // 6 minutes
    server.listen(this.port, () => {
      console.log(`🚀 App listening on the port ${this.port}`)
    })
  }

  public getServer(): express.Application {
    return this.app
  }

  private initializeMiddlewares() {
    this.app.use(cookieParser())
    this.app.use(cors())
    this.app.use(express.static('./src/public'))
    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.app.use(bodyParser.json())
    this.app.use(allowGoogleAnalytics)
    this.app.use(showCookieMessage)
    this.initializeLogin()
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach((route) => {
      this.app.use('/', route.router)
    })
  }

  private initializeRenderEngine() {
    const views = [
      path.join(__dirname, '../../node_modules/govuk-frontend'),
      path.join(__dirname, './views'),
    ]

    nunjucks.configure(views, {
      autoescape: true,
      express: this.app,
    })
    this.app.engine('html', nunjucks.render)
    this.app.set('views', views)
    this.app.set('view engine', 'html')
  }

  private initializeLogin() {
    if (!process.env.ENABLE_AUTH) {
      console.log('Auth is disabled')
      return
    }
    console.log('Auth is enabled')

    passport.serializeUser((user: any, done: any) => done(null, user))
    passport.deserializeUser((user: any, done: any) => done(null, user))

    this.app.use(
      session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: true },
        store: redisStore,
      })
    )

    this.app.set('trust proxy', 1) // trust first proxy
    this.app.use(passport.initialize())
    this.app.use(passport.session())

    passport.use(
      new OAuth2Strategy(
        {
          authorizationURL: process.env.OAUTH_AUTH_URL || 'not set',
          tokenURL: process.env.OAUTH_TOKEN_URL || 'not set',
          clientID: process.env.OAUTH_ID || 'not set',
          clientSecret: process.env.OAUTH_SECRET || 'not set',
          callbackURL: process.env.OAUTH_CALLBACK_URL || 'not set',
        },
        function (
          accessToken: string,
          refreshToken: string,
          profile: any,
          cb: any
        ) {
          console.log(
            'OAuth2Strategy callback',
            accessToken,
            refreshToken,
            profile
          )
          cb(null, profile)
        }
      )
    )

    this.app.get('/login', passport.authenticate('oauth2'))
    this.app.get(
      '/auth/gds/callback',
      passport.authenticate('oauth2', '/error-callback'),
      async (req, res) => res.redirect('/')
    )
  }
}

export default App
