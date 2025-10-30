/**
 * EAN (European Article Number) Validation Utilities
 * Supports EAN-8, EAN-13, UPC-A, UPC-E
 */

export type EANType = 'EAN-8' | 'EAN-13' | 'UPC-A' | 'UPC-E' | 'INVALID'

/**
 * Validate EAN-13 barcode
 * EAN-13 consists of 13 digits with a checksum digit
 */
export function validateEAN13(ean: string): boolean {
  if (!/^\d{13}$/.test(ean)) {
    return false
  }

  const digits = ean.split('').map(Number)
  const checksum = digits.pop()!

  // Calculate checksum: sum of odd positioned digits + 3 * sum of even positioned digits
  const sum = digits.reduce((acc, digit, index) => {
    return acc + digit * (index % 2 === 0 ? 1 : 3)
  }, 0)

  const calculatedChecksum = (10 - (sum % 10)) % 10

  return calculatedChecksum === checksum
}

/**
 * Validate EAN-8 barcode
 * EAN-8 consists of 8 digits with a checksum digit
 */
export function validateEAN8(ean: string): boolean {
  if (!/^\d{8}$/.test(ean)) {
    return false
  }

  const digits = ean.split('').map(Number)
  const checksum = digits.pop()!

  // Calculate checksum: 3 * sum of odd positioned + sum of even positioned
  const sum = digits.reduce((acc, digit, index) => {
    return acc + digit * (index % 2 === 0 ? 3 : 1)
  }, 0)

  const calculatedChecksum = (10 - (sum % 10)) % 10

  return calculatedChecksum === checksum
}

/**
 * Validate UPC-A barcode (12 digits)
 * UPC-A is similar to EAN-13 without the first digit
 */
export function validateUPCA(upc: string): boolean {
  if (!/^\d{12}$/.test(upc)) {
    return false
  }

  const digits = upc.split('').map(Number)
  const checksum = digits.pop()!

  const sum = digits.reduce((acc, digit, index) => {
    return acc + digit * (index % 2 === 0 ? 3 : 1)
  }, 0)

  const calculatedChecksum = (10 - (sum % 10)) % 10

  return calculatedChecksum === checksum
}

/**
 * Validate any EAN/UPC barcode
 */
export function validateEAN(code: string): boolean {
  const cleanCode = code.trim().replace(/[\s-]/g, '')

  switch (cleanCode.length) {
    case 8:
      return validateEAN8(cleanCode)
    case 12:
      return validateUPCA(cleanCode)
    case 13:
      return validateEAN13(cleanCode)
    default:
      return false
  }
}

/**
 * Detect EAN type
 */
export function detectEANType(code: string): EANType {
  const cleanCode = code.trim().replace(/[\s-]/g, '')

  if (cleanCode.length === 8 && validateEAN8(cleanCode)) {
    return 'EAN-8'
  }

  if (cleanCode.length === 13 && validateEAN13(cleanCode)) {
    return 'EAN-13'
  }

  if (cleanCode.length === 12 && validateUPCA(cleanCode)) {
    return 'UPC-A'
  }

  return 'INVALID'
}

/**
 * Format EAN for display (add spaces for readability)
 */
export function formatEAN(code: string): string {
  const cleanCode = code.trim().replace(/[\s-]/g, '')
  const type = detectEANType(cleanCode)

  switch (type) {
    case 'EAN-13':
      // Format: XX XXXXX XXXXXX X
      return cleanCode.replace(/(\d{2})(\d{5})(\d{5})(\d{1})/, '$1 $2 $3 $4')
    case 'EAN-8':
      // Format: XXXX XXXX
      return cleanCode.replace(/(\d{4})(\d{4})/, '$1 $2')
    case 'UPC-A':
      // Format: X XXXXX XXXXX X
      return cleanCode.replace(/(\d{1})(\d{5})(\d{5})(\d{1})/, '$1 $2 $3 $4')
    default:
      return cleanCode
  }
}

/**
 * Calculate checksum digit for incomplete EAN
 */
export function calculateEANChecksum(partialCode: string): number {
  const digits = partialCode.split('').map(Number)

  if (partialCode.length === 12) {
    // EAN-13 checksum
    const sum = digits.reduce((acc, digit, index) => {
      return acc + digit * (index % 2 === 0 ? 1 : 3)
    }, 0)
    return (10 - (sum % 10)) % 10
  } else if (partialCode.length === 7) {
    // EAN-8 checksum
    const sum = digits.reduce((acc, digit, index) => {
      return acc + digit * (index % 2 === 0 ? 3 : 1)
    }, 0)
    return (10 - (sum % 10)) % 10
  } else if (partialCode.length === 11) {
    // UPC-A checksum
    const sum = digits.reduce((acc, digit, index) => {
      return acc + digit * (index % 2 === 0 ? 3 : 1)
    }, 0)
    return (10 - (sum % 10)) % 10
  }

  throw new Error('Invalid partial code length')
}

/**
 * Generate a complete EAN from partial code
 */
export function completeEAN(partialCode: string): string {
  const cleanCode = partialCode.trim().replace(/[\s-]/g, '')

  if (cleanCode.length === 12 || cleanCode.length === 7 || cleanCode.length === 11) {
    const checksum = calculateEANChecksum(cleanCode)
    return cleanCode + checksum
  }

  throw new Error('Invalid partial code length. Expected 12, 11, or 7 digits.')
}

/**
 * Extract country code from EAN-13
 * First 3 digits represent the country/region
 */
export function getCountryCode(ean: string): string | null {
  if (!validateEAN13(ean)) {
    return null
  }

  return ean.substring(0, 3)
}

/**
 * Get country name from EAN-13
 */
export function getCountryName(ean: string): string | null {
  const code = getCountryCode(ean)
  if (!code) return null

  const countryMap: Record<string, string> = {
    '000-019': 'US and Canada',
    '020-029': 'In-Store',
    '030-039': 'US Drugs',
    '040-049': 'Restricted',
    '050-059': 'Coupons',
    '060-139': 'US and Canada',
    '200-299': 'Restricted',
    '300-379': 'France',
    '380': 'Bulgaria',
    '383': 'Slovenia',
    '385': 'Croatia',
    '387': 'Bosnia-Herzegovina',
    '389': 'Montenegro',
    '400-440': 'Germany',
    '450-459': 'Japan',
    '460-469': 'Russia',
    '470': 'Kyrgyzstan',
    '471': 'Taiwan',
    '474': 'Estonia',
    '475': 'Latvia',
    '476': 'Azerbaijan',
    '477': 'Lithuania',
    '478': 'Uzbekistan',
    '479': 'Sri Lanka',
    '480': 'Philippines',
    '481': 'Belarus',
    '482': 'Ukraine',
    '484': 'Moldova',
    '485': 'Armenia',
    '486': 'Georgia',
    '487': 'Kazakhstan',
    '488': 'Tajikistan',
    '489': 'Hong Kong',
    '490-499': 'Japan',
    '500-509': 'UK',
    '520-521': 'Greece',
    '528': 'Lebanon',
    '529': 'Cyprus',
    '530': 'Albania',
    '531': 'Macedonia',
    '535': 'Malta',
    '539': 'Ireland',
    '540-549': 'Belgium & Luxembourg',
    '560': 'Portugal',
    '569': 'Iceland',
    '570-579': 'Denmark',
    '590': 'Poland',
    '594': 'Romania',
    '599': 'Hungary',
    '600-601': 'South Africa',
    '603': 'Ghana',
    '604': 'Senegal',
    '608': 'Bahrain',
    '609': 'Mauritius',
    '611': 'Morocco',
    '613': 'Algeria',
    '615': 'Nigeria',
    '616': 'Kenya',
    '618': 'Ivory Coast',
    '619': 'Tunisia',
    '621': 'Syria',
    '622': 'Egypt',
    '624': 'Libya',
    '625': 'Jordan',
    '626': 'Iran',
    '627': 'Kuwait',
    '628': 'Saudi Arabia',
    '629': 'Emirates',
    '640-649': 'Finland',
    '690-699': 'China',
    '700-709': 'Norway',
    '729': 'Israel',
    '730-739': 'Sweden',
    '740': 'Guatemala',
    '741': 'El Salvador',
    '742': 'Honduras',
    '743': 'Nicaragua',
    '744': 'Costa Rica',
    '745': 'Panama',
    '746': 'Dominican Republic',
    '750': 'Mexico',
    '754-755': 'Canada',
    '759': 'Venezuela',
    '760-769': 'Switzerland',
    '770-771': 'Colombia',
    '773': 'Uruguay',
    '775': 'Peru',
    '777': 'Bolivia',
    '778-779': 'Argentina',
    '780': 'Chile',
    '784': 'Paraguay',
    '786': 'Ecuador',
    '789-790': 'Brazil',
    '800-839': 'Italy',
    '840-849': 'Spain',
    '850': 'Cuba',
    '858': 'Slovakia',
    '859': 'Czech',
    '860': 'Serbia',
    '865': 'Mongolia',
    '867': 'North Korea',
    '868-869': 'Turkey',
    '870-879': 'Netherlands',
    '880': 'South Korea',
    '884': 'Cambodia',
    '885': 'Thailand',
    '888': 'Singapore',
    '890': 'India',
    '893': 'Vietnam',
    '896': 'Pakistan',
    '899': 'Indonesia',
    '900-919': 'Austria',
    '930-939': 'Australia',
    '940-949': 'New Zealand',
    '950': 'GS1 Global Office',
    '951': 'EPC global',
    '955': 'Malaysia',
    '958': 'Macau',
  }

  const numCode = parseInt(code)

  for (const [range, country] of Object.entries(countryMap)) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(Number)
      if (numCode >= start && numCode <= end) {
        return country
      }
    } else if (parseInt(range) === numCode) {
      return country
    }
  }

  return 'Unknown'
}

/**
 * Convert UPC-A to EAN-13 by adding leading zero
 */
export function upcToEAN(upc: string): string {
  if (!validateUPCA(upc)) {
    throw new Error('Invalid UPC-A code')
  }

  return '0' + upc
}

/**
 * Convert EAN-13 to UPC-A (if possible)
 */
export function eanToUPC(ean: string): string | null {
  if (!validateEAN13(ean)) {
    throw new Error('Invalid EAN-13 code')
  }

  // Only EANs starting with 0 can be converted to UPC
  if (ean[0] === '0') {
    return ean.substring(1)
  }

  return null
}
