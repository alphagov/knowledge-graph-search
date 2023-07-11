import { Request, Response, NextFunction } from 'express'
import hasSignonUpdatePermissions from './hasSignonUpdatePermissions'
import { getUserProfile } from '../services/signon'
import { expect } from '@jest/globals'

jest.mock('../services/signon', () => ({
  getUserProfile: jest.fn(),
}))

describe('hasSignonUpdatePermissions middleware', () => {
  let req: Request
  let res: Response
  let next: NextFunction

  beforeEach(() => {
    req = {} as Request
    res = {} as Response
    next = jest.fn() as NextFunction
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 Unauthorized if no user token is provided', async () => {
    req.headers = {}
    res.json = jest.fn()
    res.status = jest.fn(() => res)
    await hasSignonUpdatePermissions(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorised' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 Unauthorized if user does not have update permissions', async () => {
    req.headers = { authorization: 'Bearer user_token' }
    res.json = jest.fn()
    res.status = jest.fn(() => res)
    ;(getUserProfile as jest.Mock).mockResolvedValue({
      user: { permissions: ['some_other_permission'] },
    })

    await hasSignonUpdatePermissions(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorised' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next if user has update permissions', async () => {
    req.headers = { authorization: 'Bearer user_token' }
    res.json = jest.fn()
    res.status = jest.fn(() => res)
    ;(getUserProfile as jest.Mock).mockResolvedValue({
      user: { permissions: ['user_update_permission'] },
    })

    await hasSignonUpdatePermissions(req, res, next)

    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
