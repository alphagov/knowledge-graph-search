import { Response } from 'express'
import { ENV } from '../enums/environments'

export const setCookie = (res: Response, cookieName: string, cookieValue: string, maxAge?: number): void => {
  res.cookie(cookieName, cookieValue, {
    maxAge: maxAge || parseInt(process.env.COOKIE_SETTINGS_MAX_AGE || '31556952000', 10), //defaults 1 year
    sameSite: 'lax',
    httpOnly: true,
    encode: String,
    secure: process.env.NODE_ENV === ENV.PRODUCTION,
  });
}
