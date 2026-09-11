const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required'
  if (!isValidEmail(email)) return 'Enter a valid email address'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number'
  }
  return null
}

export function validateLoginPassword(password: string): string | null {
  if (!password) return 'Password is required'
  return null
}

export function validateFullName(name: string): string | null {
  if (!name.trim()) return 'Full name is required'
  if (name.trim().length < 2) return 'Enter your full name'
  return null
}

export function validateConfirmPassword(
  password: string,
  confirm: string
): string | null {
  if (!confirm) return 'Please confirm your password'
  if (password !== confirm) return 'Passwords do not match'
  return null
}
