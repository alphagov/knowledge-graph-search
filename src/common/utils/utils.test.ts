import { expect } from '@jest/globals'
import { splitKeywords } from './utils'

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
