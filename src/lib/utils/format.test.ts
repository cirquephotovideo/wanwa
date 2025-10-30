import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatNumber,
  formatFileSize,
  formatPercentage,
  truncate,
  capitalize,
} from './format'

describe('formatCurrency', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(1234.56, 'EUR', 'fr-FR')).toBe('1 234,56 €')
    expect(formatCurrency(0, 'EUR', 'fr-FR')).toBe('0,00 €')
  })
})

describe('formatNumber', () => {
  it('should format numbers with locale separator', () => {
    expect(formatNumber(1234567, 'fr-FR')).toBe('1 234 567')
    expect(formatNumber(0, 'fr-FR')).toBe('0')
  })
})

describe('formatFileSize', () => {
  it('should format file sizes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1 MB')
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
  })
})

describe('formatPercentage', () => {
  it('should format percentages', () => {
    expect(formatPercentage(75.5)).toBe('75.5%')
    expect(formatPercentage(100, 0)).toBe('100%')
  })
})

describe('truncate', () => {
  it('should truncate long strings', () => {
    const longString = 'This is a very long string that needs to be truncated'
    expect(truncate(longString, 20)).toBe('This is a very long ...')
    expect(truncate('Short', 20)).toBe('Short')
  })
})

describe('capitalize', () => {
  it('should capitalize first letter', () => {
    expect(capitalize('hello')).toBe('Hello')
    expect(capitalize('WORLD')).toBe('World')
  })
})
