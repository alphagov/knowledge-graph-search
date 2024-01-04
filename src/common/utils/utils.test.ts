import { expect } from '@jest/globals'
import { splitKeywords, parsePhoneNumber } from './utils'

describe('[Function] splitKeywords', () => {
  it('should return an array of strings', () => {
    const searchString = 'test1 test2 test3'
    const expected = ['test1', 'test2', 'test3']
    const result = splitKeywords(searchString)
    expect(result).toEqual(expected)
  })
  it('should handle the empty string', () => {
    const searchString = ''
    const expected: string[] = []

    const result = splitKeywords(searchString)
    expect(result).toEqual(expected)
  })
  it('should handle quoted strings', () => {
    const searchString = '"test1 test2" test3'
    const expected = ['test1 test2', 'test3']

    const result = splitKeywords(searchString)
    expect(result).toEqual(expected)
  })
  it('Should handle in any order', () => {
    const searchString =
      'test1 "test2 test3" "test4" test5 "test6 test 7" test8'
    const expected = [
      'test1',
      'test2 test3',
      'test4',
      'test5',
      'test6 test 7',
      'test8',
    ]

    const result = splitKeywords(searchString)
    expect(result).toEqual(expected)
  })
})

describe('[Function] parsePhoneNumber', () => {
  it('should return a standardised phone number with no error', () => {
    const input = '01234567890'
    const expected = { phoneNumber: '+441234567890', error: false }
    const result = parsePhoneNumber(input)
    expect(result).toEqual(expected)
  })
  it('should return a malformed phone number unchanged with an error', () => {
    const input = '999999999999999999'
    const expected = { phoneNumber: '999999999999999999', error: true }
    const result = parsePhoneNumber(input)
    expect(result).toEqual(expected)
  })
  it('should return two valid phone numbers unchanged with an error', () => {
    const input = '+441234567890 +441234567890'
    const expected = { phoneNumber: '+441234567890 +441234567890', error: true }
    const result = parsePhoneNumber(input)
    expect(result).toEqual(expected)
  })
})
