import * as express from 'express'
import { isReqAJAX } from '../utils/isReqAJAX'
import config from '../config'
import { Route } from '../constants/routes'

/*
 * Express middleware enforcing user authentication. Redirects unauthenticated users to login page,
 * or returns 401 for AJAX requests. Can bypass authentication by setting the 'ENABLE_AUTH' environment variable.
 */
export const auth: (s?: string) => express.Handler =
  (redirectUrl = Route.login) =>
  (req, res, next) => {
    if (!config.authEnabled) {
      return next()
    }

    // eslint-disable-next-line
    const isAuthenticated =
      req.isAuthenticated &&
      req.isAuthenticated() &&
      (req.user as any)?.profile?.user?.permissions?.includes('signin')
    if (isAuthenticated) {
      return next()
    }

    if (isReqAJAX(req)) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Store the requested URL in session to enable post-login redirection.
    if (req.session) {
      // eslint-disable-next-line
      // @ts-ignore
      req.session.returnTo = req.originalUrl || req.url
    }

    return res.redirect(redirectUrl)
  }
