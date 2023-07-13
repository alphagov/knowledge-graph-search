import { expect } from '@jest/globals'
import e from 'express'
import AuthController from './auth.controller'
import { SessionStore } from '../services/sessionStore'
import { Route } from '../constants/routes'

jest.mock('../config', () => ({
  __esModule: true,
  default: {
    ...jest.requireActual('../config').default,
    authEnabled: true,
  },
}))

jest.mock('ioredis', () => {
  class RedisMock {
    private port: number
    private host: string
    constructor(port: number, host: string) {
      this.port = port
      this.host = host
    }

    on() {
      return 'void'
    }
  }
  return {
    __esModule: true,
    default: RedisMock,
  }
})

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(async () => {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500))
})

describe('Auth Controller', () => {
  describe('reauth', () => {
    it('Uses the user ID from query parameters', async () => {
      const mockRequest = {} as e.Request
      mockRequest.params = {
        userId: 'testId',
      }
      const mockResponse = {} as e.Response
      mockResponse.send = jest.fn()
      const mockNext = {} as e.NextFunction
      jest
        .spyOn(SessionStore.prototype, 'destroySessionsForUserId')
        .mockImplementation(jest.fn())

      const controller = new AuthController()
      await controller.reauth(mockRequest, mockResponse, mockNext)
      expect(
        SessionStore.prototype.destroySessionsForUserId
      ).toHaveBeenCalledWith('testId')
    })
    it('Returns 200 with message if reauth successful', async () => {
      const mockRequest = {} as e.Request
      mockRequest.params = {
        userId: 'testId',
      }
      const mockResponse = {} as e.Response
      mockResponse.send = jest.fn()
      const mockNext = {} as e.NextFunction
      jest
        .spyOn(SessionStore.prototype, 'destroySessionsForUserId')
        .mockImplementation(jest.fn())

      const controller = new AuthController()
      await controller.reauth(mockRequest, mockResponse, mockNext)
      expect(mockResponse.send).toHaveBeenCalledWith(
        'User logged out of GovSearch successfully. UserId = testId'
      )
    })
    it('Returns 200 with no message even if there is an error', async () => {
      const mockRequest = {} as e.Request
      mockRequest.params = {
        userId: 'testId',
      }
      const mockResponse = {} as e.Response
      mockResponse.status = jest.fn()
      const mockNext = {} as e.NextFunction
      jest
        .spyOn(SessionStore.prototype, 'destroySessionsForUserId')
        .mockRejectedValue(new Error('Test error'))

      const controller = new AuthController()
      await controller.reauth(mockRequest, mockResponse, mockNext)
      expect(mockResponse.status).toHaveBeenCalledWith(200)
    })
  })

  describe('On login with success', () => {
    it('Redirects to the search endpoint', async () => {
      const mockRequest = {} as e.Request
      const mockResponse = {} as e.Response
      const mockNext = {} as e.NextFunction
      mockResponse.redirect = jest.fn()

      const controller = new AuthController()
      await controller.loginSuccessRedirect(mockRequest, mockResponse, mockNext)

      expect(mockResponse.redirect).toHaveBeenCalledWith(Route.search)
    })
  })
})
