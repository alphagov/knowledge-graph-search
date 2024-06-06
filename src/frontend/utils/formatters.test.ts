import { formatDocumentType, formatPublishingApp } from './formatters'
import { expect, it } from '@jest/globals'

describe('formatters', () => {
  describe('formatDocumentType', () => {
    it('should capitalise the first character', () => {
      const result = formatDocumentType('documentType')
      expect(result).toBe('DocumentType')
    })

    it('should replace underscores with spaces', () => {
      const result = formatDocumentType('document_type_example')
      expect(result).toBe('Document type example')
    })

    it('should handle empty strings', () => {
      const result = formatDocumentType('')
      expect(result).toBe('')
    })

    it('should handle single characters', () => {
      const result = formatDocumentType('a')
      expect(result).toBe('A')
    })
  })

  describe('formatPublishingApp', () => {
    it('should capitalise the first character', () => {
      const result = formatPublishingApp('publishingApp')
      expect(result).toBe('PublishingApp')
    })

    it('should not replace underscores with spaces', () => {
      const result = formatPublishingApp('publishing_app_example')
      expect(result).toBe('Publishing App Example')
    })

    it('should handle empty strings', () => {
      const result = formatPublishingApp('')
      expect(result).toBe('')
    })

    it('should handle single characters', () => {
      const result = formatPublishingApp('a')
      expect(result).toBe('A')
    })
  })
})
