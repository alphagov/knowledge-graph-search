/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path'
import * as http from 'http'
import cors from 'cors'
import express from 'express'
import Routes from './enums/routes'
import * as nunjucks from 'nunjucks'
import bodyParser from 'body-parser'
import { getStore, destroySessionForUserId } from './services/redisStore'
import { getUserProfile } from './services/signon'
import OAuth2Strategy, { VerifyFunctionWithRequest } from 'passport-oauth2'
import passport from 'passport'
import session from 'express-session'

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

    const handleShutdown = () => {
      console.log('NO')
      if (process.env.ENABLE_AUTH === 'true') {
        const { getClient } = require('.services/redis')
        getClient().disconnect()
      }
      server.close(() => {
        console.log('Server gracefully shut down')
        process.exit(0)
      })
    }

    process.on('SIGINT', handleShutdown)
    process.on('SIGTERM', handleShutdown)
  }

  public getServer(): express.Application {
    return this.app
  }

  private initializeMiddlewares() {
    this.app.use(cors())
    this.app.use(express.static('./src/public'))
    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.app.use(bodyParser.json())
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
        store: getStore(),
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
          passReqToCallback: true,
        },
        async function (
          req: Parameters<VerifyFunctionWithRequest>[0],
          accessToken: string,
          refreshToken: string,
          profile: any,
          doneCallback: any
        ) {
          let profileData
          try {
            profileData = await getUserProfile(accessToken)
          } catch (error) {
            console.error('ERROR fetching user data')
            console.error({ error })
            return doneCallback(error)
          }

          const userSessionData = {
            profileData,
            refreshToken,
            accessToken,
          }
          console.log('User data fetched successfully', { userSessionData })
          doneCallback(null, userSessionData)
        }
      )
    )

    this.app.get('/login', passport.authenticate('oauth2'))
    this.app.get(
      '/auth/gds/callback',
      passport.authenticate('oauth2', { failureRedirect: '/error-callback' }),
      async (req, res) => res.redirect('/')
    )

    this.app.post('/auth/gds/api/users/:userId/reauth', async (req, res) => {
      const { userId } = req.params
      try {
        await destroySessionForUserId(userId)
      } catch (error) {
        console.log('ERROR - c=in /reauth endpoint')
        console.log({ error })
        return res.status(200)
      }
      return res.send(
        `User logged out of GovSearch successfully. UserId = ${userId}`
      )
    })
  }
}

export default App
