import request from 'supertest'
import { expect } from '@jest/globals'
import e from 'express'
import App from '../app'
import { Route } from '../enums/routes'
import IndexRoute from '../routes/indexRoutes'
import CookiesController from './cookies.controller'

const indexRoute = new IndexRoute()
const app = new App([indexRoute])

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(async () => {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500))
})

describe(`[GET] ${Route.cookies}`, () => {
  it('Should respond with statusCode 200', () =>
    request(app.getServer())
      .get(`${Route.search}`)
      .set('user-agent', 'node-superagent')
      .expect(200))

  it('Should throw an error and call next', async () => {
    const mockRequest = {
      cookies: {
        acceptAnalytics: '',
      },
      query: {
        saved: '',
      },
    } as unknown as e.Request
    const mockResponse = {} as e.Response
    const mockNext = jest.fn()
    const mockError = Error()
    mockResponse.render = () => {
      throw mockError
    }
    const controller = new CookiesController()
    await controller.cookies(mockRequest, mockResponse, mockNext)
    expect(mockNext).toHaveBeenCalledWith(mockError)
  })
})

describe(`[POST] ${Route.saveCookieSettings}`, () => {
  it('Should respond with statusCode 302 and redirect to /', async () => {
    await request(app.getServer())
      .post(`${Route.saveCookieSettings}`)
      .set('user-agent', 'node-superagent')
      .set({ Referer: '/' })
      .send({ acceptAnalytics: 'true' })
      .expect(302, {})
      .expect('Location', '/')
  })

  it('Should respond with statusCode 302 and redirect to /cookies?saved=true then set cookies', async () => {
    await request(app.getServer())
      .post(`${Route.saveCookieSettings}`)
      .set('user-agent', 'node-superagent')
      .set({ Referer: '/cookies' })
      .send({ acceptAnalytics: 'true' })
      .expect(302, {})
      .expect('Location', '/cookies?saved=true')
      .then((res) => {
        expect(res.header['set-cookie'][1]).toContain('cookieMessage=false;')
        expect(res.header['set-cookie'][2]).toContain('acceptAnalytics=true;')
      })
  })

  it('Should throw an error and call next', async () => {
    const createMockRequest = () =>
      ({
        body: {
          acceptAnalytics: 'true',
        },
        headers: {
          referer: '/',
        },
      } as unknown as e.Request)

    const creatMockResponse = () =>
      ({
        cookie: jest.fn(),
        redirect: jest.fn(),
        locals: {},
      } as unknown as e.Response)
    const mockRequest = createMockRequest()
    const mockResponse = creatMockResponse()
    const mockNext = jest.fn()

    const mockError = Error()
    mockResponse.redirect = () => {
      throw mockError
    }
    const controller = new CookiesController()
    await controller.saveCookieSettings(mockRequest, mockResponse, mockNext)
    expect(mockNext).toHaveBeenCalledWith(mockError)
  })
})

describe(`[POST] ${Route.hideCookieSuccessBanner}`, () => {
  it('Should respond with statusCode 302 and redirect to / and set cookie', async () => {
    await request(app.getServer())
      .post(`${Route.hideCookieSuccessBanner}`)
      .set('user-agent', 'node-superagent')
      .set({ Referer: '/' })
      .send({ hideCookieSuccessBanner: 'true' })
      .expect(302, {})
      .expect('Location', '/')
      .then((res) => {
        expect(res.header['set-cookie'][1]).toContain('cookieMessage=false;')
      })
  })

  it('Should throw an error and call next', async () => {
    const createMockRequest = () =>
      ({
        body: {
          hideCookieSuccessBanners: 'true',
        },
        headers: {
          referer: '/',
        },
      } as unknown as e.Request)

    const creatMockResponse = () =>
      ({
        cookie: jest.fn(),
        redirect: jest.fn(),
        locals: {},
      } as unknown as e.Response)
    const mockRequest = createMockRequest()
    const mockResponse = creatMockResponse()
    const mockNext = jest.fn()

    const mockError = Error()
    mockResponse.redirect = () => {
      throw mockError
    }
    const controller = new CookiesController()
    await controller.hideCookieSuccessBanner(
      mockRequest,
      mockResponse,
      mockNext
    )
    expect(mockNext).toHaveBeenCalledWith(mockError)
  })
})
