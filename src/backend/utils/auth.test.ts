import type e from 'express'
import { expect } from '@jest/globals'
import { getBearerToken } from './auth'

describe('[function] getBearerToken', () => {
  const buildMockReq = (headerValue: string) =>
    ({
      headers: { authorization: headerValue },
    } as e.Request)
  it('Returns null if header value is wrong format', () => {
    const badHeaders = [
      '',
      '12345',
      'badKeyword 12345',
      'Bearer',
      'Bearer                 ',
      'Bearer ',
    ]
    for (const badHeader in badHeaders) {
      const req = buildMockReq(badHeader)
      expect(getBearerToken(req)).toEqual(null)
    }
  })
  it('Returns the token if header value is correct', () => {
    const token = '12345'
    const header = `Bearer ${token}`
    const req = buildMockReq(header)
    expect(getBearerToken(req)).toBe(token)
  })
})
