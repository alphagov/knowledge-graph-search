/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path'
import * as http from 'http'
import cors from 'cors'
import express from 'express'
import Routes from './constants/routes'
import * as nunjucks from 'nunjucks'
import bodyParser from 'body-parser'
import { getStore } from './services/redisStore'
import { getUserProfile } from './services/signon'
import OAuth2Strategy from 'passport-oauth2'
import passport from 'passport'
import session from 'express-session'
import { generateSessionId } from './utils/auth'
import config from './config'
import { pageNotFound } from './middleware/pageNotFound'
import { errorMiddleware } from './middleware/errorMiddleware'
import { allowGoogleAnalytics } from './middleware/allowGoogleAnalytics'
import { showCookieMessage } from './middleware/showCookieMessage'
import { hideFeedbackSurvey } from './middleware/hideFeedbackSurvey'
import log, { httpLogger } from './utils/logging'
import cookieParser from 'cookie-parser'

class App {
  public app: express.Express = express()
  public port: string | number

  constructor(routes: Routes[]) {
    this.app = express()
    this.port = config.port

    this.initializeMiddlewares()
    this.initializeRoutes(routes)
    this.initializeRenderEngine()
    this.initializeFinalMiddlewares()
  }

  public listen(): void {
    const server = http.createServer(this.app)
    server.keepAliveTimeout = 1000 * (60 * 6) // 6 minutes
    server.listen(this.port, () => {
      log.info(`🚀 App listening on the port ${this.port}`)
    })

    const handleShutdown = () => {
      if (config.authEnabled) {
        const { getClient } = require('.services/redis')
        getClient().disconnect()
      }
      server.close(() => {
        log.info('Server gracefully shut down')
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
    this.app.use(cookieParser())
    this.app.use(cors())
    this.app.use(express.static('./src/public'))
    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.app.use(bodyParser.json())
    this.app.use(allowGoogleAnalytics)
    this.app.use(showCookieMessage)
    this.app.use(hideFeedbackSurvey)
    this.initializeLogin()
    this.app.use(httpLogger)
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
    if (!config.authEnabled) {
      log.debug('Auth is disabled')
      return
    }
    log.debug('Auth is enabled')

    passport.serializeUser((user: any, done: any) => done(null, user))
    passport.deserializeUser((user: any, done: any) => done(null, user))

    this.app.use(
      session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: !(config.environment === 'local') },
        store: getStore(),
        genid: generateSessionId,
      })
    )

    this.app.set('trust proxy', 1) // trust first proxy
    this.app.use(passport.initialize())
    this.app.use(passport.session())

    passport.use(
      new OAuth2Strategy(
        {
          authorizationURL: config.oauthAuthUrl || 'not set',
          tokenURL: config.oauthTokenUrl || 'not set',
          clientID: config.clientId || 'not set',
          clientSecret: config.clientSecret || 'not set',
          callbackURL: config.oauthCallbackUrl || 'not set',
        },
        async function (
          accessToken: string,
          refreshToken: string,
          profile: any,
          doneCallback: any
        ) {
          let profileData
          try {
            log.debug('Fetching user profile')
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
          log.debug({ userSessionData }, 'User data fetched successfully')
          doneCallback(null, userSessionData)
        }
      )
    )
  }

  private initializeFinalMiddlewares() {
    this.app.use(pageNotFound)
    this.app.use(errorMiddleware)
  }
}

export default App
