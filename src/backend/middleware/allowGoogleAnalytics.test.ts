import { allowGoogleAnalytics } from './allowGoogleAnalytics'
import { expect } from '@jest/globals'

process.env.GTM_ID = 'SOME_GTM_ID'
process.env.GTM_AUTH = 'GTM_AUTH'

const req: any = {
  cookies: {
    acceptAnalytics: 'true',
  },
}
const next: any = jest.fn()
const res: any = {
  headers: {},
  locals: {},
  cookie(name: any, value: any) {
    this.headers[name] = value
  },
}

describe('allowGoogleAnalytics', () => {
  it('Should retuem the correct object', () => {
    allowGoogleAnalytics(req, res, next)
    expect(res.locals).toEqual({
      allowGoogleAnalytics: true,
      GTM_ID: 'SOME_GTM_ID',
      GTM_AUTH: 'GTM_AUTH',
    })
  })
})
