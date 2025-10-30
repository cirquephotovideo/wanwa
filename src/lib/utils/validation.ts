/**
 * Validation utilities
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateEAN(ean: string): boolean {
  // Remove any spaces or dashes
  const cleanEAN = ean.replace(/[\s-]/g, '')

  // EAN-13 validation
  if (cleanEAN.length === 13) {
    const digits = cleanEAN.split('').map(Number)
    const checksum =
      (10 -
        (digits
          .slice(0, 12)
          .reduce((sum, digit, i) => sum + digit * (i % 2 === 0 ? 1 : 3), 0) %
          10)) %
      10

    return checksum === digits[12]
  }

  // EAN-8 validation
  if (cleanEAN.length === 8) {
    const digits = cleanEAN.split('').map(Number)
    const checksum =
      (10 -
        (digits
          .slice(0, 7)
          .reduce((sum, digit, i) => sum + digit * (i % 2 === 0 ? 3 : 1), 0) %
          10)) %
      10

    return checksum === digits[7]
  }

  return false
}

export function validateURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validatePrice(price: number): boolean {
  return !isNaN(price) && price >= 0 && isFinite(price)
}

export function validatePhoneNumber(phone: string): boolean {
  // French phone number validation (basic)
  const phoneRegex = /^(\+33|0)[1-9](\d{2}){4}$/
  return phoneRegex.test(phone.replace(/[\s.-]/g, ''))
}

export function sanitizeHTML(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

export function validateJSON(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}
