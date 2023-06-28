import { showCookieMessage } from './showCookieMessage'
import { expect } from '@jest/globals'

describe('showCookieMessage', () => {
  it('Should return showCookieMessage: true', () => {
    const req: any = {
      cookies: {
        acceptAnalytics: null,
        cookieMessage: null,
      },
      query: {
        saved: null,
      },
    }
    const next: any = jest.fn()
    const res: any = {
      headers: {},
      locals: {},
      setHeader: jest.fn(),
      cookie(name: any, value: any) {
        this.headers[name] = value
      },
    }
    showCookieMessage(req, res, next)
    expect(res.locals).toEqual({ showCookieMessage: true })
  })

  it('Should return showCookieSuccessBanner: true', () => {
    const req: any = {
      cookies: {
        acceptAnalytics: 'true',
        cookieMessage: null,
      },
      query: {
        saved: null,
      },
    }
    const next: any = jest.fn()
    const res: any = {
      headers: {},
      locals: {},
      setHeader: jest.fn(),
      cookie(name: any, value: any) {
        this.headers[name] = value
      },
    }
    showCookieMessage(req, res, next)
    expect(res.locals).toEqual({ showCookieSuccessBanner: true })
  })

  it('Should return showCookieSuccessBanner: false and showCookieMessage: false', () => {
    const req: any = {
      cookies: {
        acceptAnalytics: 'yes',
        cookieMessage: 'yes',
      },
      query: {
        saved: null,
      },
    }
    const next: any = jest.fn()
    const res: any = {
      headers: {},
      locals: {},
      setHeader: jest.fn(),
      cookie(name: any, value: any) {
        this.headers[name] = value
      },
    }
    showCookieMessage(req, res, next)
    expect(res.locals).toEqual({
      showCookieSuccessBanner: false,
      showCookieMessage: false,
    })
  })
})
