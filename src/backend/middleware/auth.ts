import * as express from 'express';
import { isReqAJAX } from '../../utils/isReqAJAX';

declare global {
  namespace Express {
    interface Request {
      session: any
    }
  }
}

/*
 * Express middleware enforcing user authentication. Redirects unauthenticated users to login page,
 * or returns 401 for AJAX requests. Can bypass authentication by setting the 'ENABLE_AUTH' environment variable.
 */
export const auth: (s?: string) => express.Handler =
  (redirectUrl = '/login') =>
  (req, res, next) => {
    if (process.env.ENABLE_AUTH !== 'true') {
      return next();
    }

    // eslint-disable-next-line
    const isAuthenticated = req.isAuthenticated && req.isAuthenticated()
    if (isAuthenticated) {
      return next();
    }

    if (isReqAJAX(req)) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Store the requested URL in session to enable post-login redirection.
    if (req.session) {
      req.session.returnTo = req.originalUrl || req.url;
    }

    return res.redirect(redirectUrl);
  };
