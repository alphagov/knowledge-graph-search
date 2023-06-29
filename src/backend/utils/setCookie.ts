import { Response } from 'express'
import { ENV } from '../enums/environments'
import config from '../config'

export const setCookie = (
  res: Response,
  cookieName: string,
  cookieValue: string,
  maxAge?: number
): void => {
  res.cookie(cookieName, cookieValue, {
    maxAge:
      maxAge ||
      parseInt(config.cookieSettingsMaxAge, 10),
    sameSite: 'lax',
    httpOnly: true,
    encode: String,
    secure: config.environment === ENV.PRODUCTION,
  })
}
