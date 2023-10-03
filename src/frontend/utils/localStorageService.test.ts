import { LocalStorageService } from './localStorageService'
import { expect, it } from '@jest/globals'

describe('LocalStorageService', () => {
  let mockSetItem: jest.Mock
  let mockGetItem: jest.Mock

  beforeEach(() => {
    jest.mock('./localStorageService', () => ({
      ...jest.requireActual('./localStorageService'),
      loadLayoutStateFromCache: jest.fn(),
    }))

    mockSetItem = jest.fn()
    mockGetItem = jest.fn()

    // @ts-ignore
    global.localStorage = {
      setItem: mockSetItem,
      getItem: mockGetItem,
    }
  })

  describe('saveItem', () => {
    it('should save an item to localStorage', () => {
      const key = 'key'
      const value = { data: 'value' }
      LocalStorageService.saveItem(key, value)
      expect(mockSetItem).toHaveBeenCalledWith(key, JSON.stringify(value))
    })

    it('should log an error when saving fails', () => {
      const key = 'key'
      const value = { data: 'value' }
      const error = new Error('Failed to save')
      mockSetItem.mockImplementationOnce(() => {
        throw error
      })
      console.error = jest.fn()

      LocalStorageService.saveItem(key, value)

      expect(console.error).toHaveBeenCalledWith(
        'Failed to save  state to localStorage:',
        error
      )
    })
  })

  describe('loadItem', () => {
    it('should load an item from localStorage', () => {
      const key = 'key'
      const value = { data: 'value' }
      mockGetItem.mockReturnValueOnce(JSON.stringify(value))

      const result = LocalStorageService.loadItem(key)

      expect(result).toEqual(value)
    })

    it('should log an error when loading fails', () => {
      const key = 'key'
      const error = new Error('Failed to load')
      mockGetItem.mockImplementationOnce(() => {
        throw error
      })
      console.error = jest.fn()

      const result = LocalStorageService.loadItem(key)

      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load  state from localStorage:',
        error
      )
    })
  })
})
