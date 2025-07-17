/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitizes HTML input by escaping potentially dangerous characters
 */
export const sanitizeHtml = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

/**
 * Validates and sanitizes email addresses
 */
export const sanitizeEmail = (email: string): string => {
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  return sanitized;
};

/**
 * Sanitizes phone numbers by removing non-numeric characters
 */
export const sanitizePhone = (phone: string): string => {
  const cleaned = phone.replace(/[^\d+\-\s()]/g, '');
  if (cleaned.length < 10) {
    throw new Error('Phone number must be at least 10 digits');
  }
  return cleaned;
};

/**
 * Sanitizes address input by limiting length and escaping HTML
 */
export const sanitizeAddress = (address: string): string => {
  const trimmed = address.trim();
  if (trimmed.length > 200) {
    throw new Error('Address too long');
  }
  return sanitizeHtml(trimmed);
};

/**
 * Sanitizes general text input by escaping HTML and limiting length
 */
export const sanitizeText = (text: string, maxLength: number = 100): string => {
  const trimmed = text.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
  }
  return sanitizeHtml(trimmed);
};

/**
 * Rate limiting utility
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string, 
  maxRequests: number = 5, 
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const existing = rateLimitMap.get(identifier);
  
  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (existing.count >= maxRequests) {
    return false;
  }
  
  existing.count++;
  return true;
};