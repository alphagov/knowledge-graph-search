import { Request } from 'express'
import { isReqAJAX } from '../ts/utils'

describe('isReqAJAX', () => {
  it('should return false if no header is present', () => {
    const req = {
      header: jest.fn().mockReturnValue(null),
    } as unknown as Request

    expect(isReqAJAX(req)).toBe(false)
  })

  it('should return false if header value is an array', () => {
    const req = {
      header: jest.fn().mockReturnValue(['fetch', 'xhr']),
    } as unknown as Request

    expect(isReqAJAX(req)).toBe(false)
  })

  it('should return false if header value is not in supportedAjaxAPIs', () => {
    const req = {
      header: jest.fn().mockReturnValue('banana-api'),
    } as unknown as Request

    expect(isReqAJAX(req)).toBe(false)
  })

  it('should return true if header value is in supportedAjaxAPIs', () => {
    const req = {
      header: jest.fn().mockReturnValue('fetch'),
    } as unknown as Request

    expect(isReqAJAX(req)).toBe(true)
  })
})
