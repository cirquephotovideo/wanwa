import { describe, it, expect } from 'vitest'
import {
  validateEAN,
  validateEAN13,
  validateEAN8,
  validateUPCA,
  detectEANType,
  formatEAN,
  calculateEANChecksum,
  completeEAN,
  getCountryCode,
  getCountryName,
  upcToEAN,
  eanToUPC,
} from './ean-validator'

describe('EAN Validator', () => {
  describe('validateEAN13', () => {
    it('should validate correct EAN-13', () => {
      expect(validateEAN13('5901234123457')).toBe(true)
      expect(validateEAN13('4006381333931')).toBe(true)
      expect(validateEAN13('9780123456786')).toBe(true)
    })

    it('should reject invalid EAN-13', () => {
      expect(validateEAN13('5901234123456')).toBe(false) // Wrong checksum
      expect(validateEAN13('590123412345')).toBe(false) // Too short
      expect(validateEAN13('59012341234567')).toBe(false) // Too long
      expect(validateEAN13('590123412345A')).toBe(false) // Contains letter
    })
  })

  describe('validateEAN8', () => {
    it('should validate correct EAN-8', () => {
      expect(validateEAN8('96385074')).toBe(true)
      expect(validateEAN8('12345670')).toBe(true)
    })

    it('should reject invalid EAN-8', () => {
      expect(validateEAN8('96385075')).toBe(false) // Wrong checksum
      expect(validateEAN8('9638507')).toBe(false) // Too short
    })
  })

  describe('validateUPCA', () => {
    it('should validate correct UPC-A', () => {
      expect(validateUPCA('012345678905')).toBe(true)
      expect(validateUPCA('042100005264')).toBe(true)
    })

    it('should reject invalid UPC-A', () => {
      expect(validateUPCA('012345678906')).toBe(false) // Wrong checksum
      expect(validateUPCA('01234567890')).toBe(false) // Too short
    })
  })

  describe('validateEAN', () => {
    it('should validate any valid EAN/UPC', () => {
      expect(validateEAN('5901234123457')).toBe(true) // EAN-13
      expect(validateEAN('96385074')).toBe(true) // EAN-8
      expect(validateEAN('012345678905')).toBe(true) // UPC-A
    })

    it('should handle spaces and dashes', () => {
      expect(validateEAN('59 01234 12345 7')).toBe(true)
      expect(validateEAN('5901234-123457')).toBe(true)
    })
  })

  describe('detectEANType', () => {
    it('should detect EAN-13', () => {
      expect(detectEANType('5901234123457')).toBe('EAN-13')
    })

    it('should detect EAN-8', () => {
      expect(detectEANType('96385074')).toBe('EAN-8')
    })

    it('should detect UPC-A', () => {
      expect(detectEANType('012345678905')).toBe('UPC-A')
    })

    it('should return INVALID for invalid codes', () => {
      expect(detectEANType('123456')).toBe('INVALID')
      expect(detectEANType('5901234123456')).toBe('INVALID')
    })
  })

  describe('formatEAN', () => {
    it('should format EAN-13', () => {
      expect(formatEAN('5901234123457')).toBe('59 01234 12345 7')
    })

    it('should format EAN-8', () => {
      expect(formatEAN('96385074')).toBe('9638 5074')
    })

    it('should format UPC-A', () => {
      expect(formatEAN('012345678905')).toBe('0 12345 67890 5')
    })
  })

  describe('calculateEANChecksum', () => {
    it('should calculate EAN-13 checksum', () => {
      expect(calculateEANChecksum('590123412345')).toBe(7)
      expect(calculateEANChecksum('400638133393')).toBe(1)
    })

    it('should calculate EAN-8 checksum', () => {
      expect(calculateEANChecksum('9638507')).toBe(4)
      expect(calculateEANChecksum('1234567')).toBe(0)
    })

    it('should calculate UPC-A checksum', () => {
      expect(calculateEANChecksum('01234567890')).toBe(5)
    })

    it('should throw for invalid length', () => {
      expect(() => calculateEANChecksum('12345')).toThrow()
    })
  })

  describe('completeEAN', () => {
    it('should complete EAN-13', () => {
      expect(completeEAN('590123412345')).toBe('5901234123457')
    })

    it('should complete EAN-8', () => {
      expect(completeEAN('9638507')).toBe('96385074')
    })

    it('should complete UPC-A', () => {
      expect(completeEAN('01234567890')).toBe('012345678905')
    })
  })

  describe('getCountryCode', () => {
    it('should extract country code from EAN-13', () => {
      expect(getCountryCode('5901234123457')).toBe('590')
      expect(getCountryCode('4006381333931')).toBe('400')
      expect(getCountryCode('3001234567892')).toBe('300')
    })

    it('should return null for invalid EAN', () => {
      expect(getCountryCode('5901234123456')).toBe(null)
    })
  })

  describe('getCountryName', () => {
    it('should get country name from EAN-13', () => {
      expect(getCountryName('5901234123457')).toBe('Poland')
      expect(getCountryName('4006381333931')).toBe('Germany')
      expect(getCountryName('3001234567892')).toBe('France')
      expect(getCountryName('7501234567895')).toBe('Mexico')
      expect(getCountryName('8901234567896')).toBe('India')
    })

    it('should return null for invalid EAN', () => {
      expect(getCountryName('5901234123456')).toBe(null)
    })
  })

  describe('upcToEAN', () => {
    it('should convert UPC-A to EAN-13', () => {
      expect(upcToEAN('012345678905')).toBe('0012345678905')
    })

    it('should throw for invalid UPC', () => {
      expect(() => upcToEAN('012345678906')).toThrow()
    })
  })

  describe('eanToUPC', () => {
    it('should convert EAN-13 to UPC-A when starting with 0', () => {
      expect(eanToUPC('0012345678905')).toBe('012345678905')
    })

    it('should return null for non-convertible EAN', () => {
      expect(eanToUPC('5901234123457')).toBe(null)
    })

    it('should throw for invalid EAN', () => {
      expect(() => eanToUPC('0012345678906')).toThrow()
    })
  })
})
