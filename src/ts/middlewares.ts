import * as express from "express"
import { isReqAJAX } from "./utils";

declare global {
  namespace Express {
    interface Request {
      session: any;
    }
  }
}

export const auth: (s?: string) => express.Handler = (redirectUrl: string = "/login") => (req, res, next) => {
    if (process.env.DISABLE_AUTH) {
        return next()
    }
    
    const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
    if (isAuthenticated) {
      return next();
    }

    if (isReqAJAX(req)) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    // Save the url to return to once logged in
    if (req.session) {
        req.session.returnTo = req.originalUrl || req.url;
    }

    return res.redirect(redirectUrl);
}
