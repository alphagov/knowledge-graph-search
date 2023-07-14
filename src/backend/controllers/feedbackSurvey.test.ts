import request from 'supertest'
import { expect } from '@jest/globals'
import e from 'express'
import App from '../app'
import { Route } from '../constants/routes'
import IndexRoute from '../routes/IndexRoutes'
import FeedbackSurveyController from './feedbackSurvey.controller'

const indexRoute = new IndexRoute()
const app = new App([indexRoute])

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(async () => {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500))
})

describe(`[GET] ${Route.feedbackSurvey}`, () => {
  it('Should respond with statusCode 200', () =>
    request(app.getServer())
      .get(`${Route.search}`)
      .set('user-agent', 'node-superagent')
      .expect(200))

  it('Should throw an error and call next', async () => {
    const createMockRequest = () =>
      ({
        headers: {},
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
    const controller = new FeedbackSurveyController()
    await controller.feedbackSurvey(mockRequest, mockResponse, mockNext)
    expect(mockNext).toHaveBeenCalledWith(mockError)
  })
})

describe(`[GET] ${Route.hideFeedbackSurvey}`, () => {
  it('Should respond with statusCode 200', () =>
    request(app.getServer())
      .get(`${Route.search}`)
      .set('user-agent', 'node-superagent')
      .expect(200))

  it('Should throw an error and call next', async () => {
    const createMockRequest = () =>
      ({
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
    const controller = new FeedbackSurveyController()
    await controller.hideFeedbackSurvey(mockRequest, mockResponse, mockNext)
    expect(mockNext).toHaveBeenCalledWith(mockError)
  })
})
