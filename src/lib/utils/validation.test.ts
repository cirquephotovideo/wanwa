import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validateEAN,
  validateURL,
  validatePrice,
  validateJSON,
} from './validation'

describe('validateEmail', () => {
  it('should validate correct emails', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name+tag@example.co.uk')).toBe(true)
  })

  it('should reject invalid emails', () => {
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
    expect(validateEmail('test@')).toBe(false)
  })
})

describe('validateEAN', () => {
  it('should validate correct EAN-13', () => {
    expect(validateEAN('5901234123457')).toBe(true)
  })

  it('should reject invalid EAN', () => {
    expect(validateEAN('1234567890')).toBe(false)
    expect(validateEAN('5901234123456')).toBe(false) // Wrong checksum
  })
})

describe('validateURL', () => {
  it('should validate correct URLs', () => {
    expect(validateURL('https://example.com')).toBe(true)
    expect(validateURL('http://localhost:3000')).toBe(true)
  })

  it('should reject invalid URLs', () => {
    expect(validateURL('not a url')).toBe(false)
    expect(validateURL('example.com')).toBe(false)
  })
})

describe('validatePrice', () => {
  it('should validate correct prices', () => {
    expect(validatePrice(0)).toBe(true)
    expect(validatePrice(99.99)).toBe(true)
  })

  it('should reject invalid prices', () => {
    expect(validatePrice(-1)).toBe(false)
    expect(validatePrice(NaN)).toBe(false)
    expect(validatePrice(Infinity)).toBe(false)
  })
})

describe('validateJSON', () => {
  it('should validate correct JSON', () => {
    expect(validateJSON('{"key": "value"}')).toBe(true)
    expect(validateJSON('[]')).toBe(true)
  })

  it('should reject invalid JSON', () => {
    expect(validateJSON('{invalid}')).toBe(false)
    expect(validateJSON('not json')).toBe(false)
  })
})
