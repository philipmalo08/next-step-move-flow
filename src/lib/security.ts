// Security configuration and utilities

export const SECURITY_CONFIG = {
  // reCAPTCHA configuration
  RECAPTCHA_SITE_KEY: '6Lek9oErAAAAADbpSLJ0uMlVRCrHLDqwQb_Ze8bB',
  
  // Rate limiting
  MAX_API_REQUESTS_PER_MINUTE: 10,
  MAX_ADDRESS_SUGGESTIONS_PER_MINUTE: 30,
  
  // Session security
  MAX_SESSION_AGE_HOURS: 24,
  SESSION_TOKEN_LENGTH: 32,
  
  // Input validation
  MAX_ADDRESS_LENGTH: 500,
  MAX_INPUT_LENGTH: 1000,
  
  // Allowed domains for CORS (production should be more restrictive)
  ALLOWED_ORIGINS: ['*'], // In production, replace with actual domain
} as const;

// Generate cryptographically secure session token
export const generateSecureToken = (): string => {
  const array = new Uint8Array(SECURITY_CONFIG.SESSION_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Validate session token format
export const validateSessionToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  if (token.length !== SECURITY_CONFIG.SESSION_TOKEN_LENGTH * 2) return false;
  return /^[a-f0-9]+$/.test(token);
};

// Check if session is expired
export const isSessionExpired = (createdAt: string): boolean => {
  const sessionAge = Date.now() - new Date(createdAt).getTime();
  const maxAge = SECURITY_CONFIG.MAX_SESSION_AGE_HOURS * 60 * 60 * 1000;
  return sessionAge > maxAge;
};

// Secure device ID generation
export const generateDeviceId = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Validate device ID format
export const validateDeviceId = (deviceId: string): boolean => {
  if (!deviceId || typeof deviceId !== 'string') return false;
  if (deviceId.length !== 32) return false;
  return /^[a-f0-9]+$/.test(deviceId);
};

// Content Security Policy headers
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co https://maps.googleapis.com",
    "frame-src https://www.google.com"
  ].join('; ')
});

// Validate and sanitize user input
export const sanitizeInput = (input: unknown): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data URLs
    .trim()
    .substring(0, SECURITY_CONFIG.MAX_INPUT_LENGTH);
};

// Sanitize cardholder name preserving spaces
export const sanitizeCardholderName = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data URLs
    .trim()
    .substring(0, 100); // Limit length for cardholder names
};

// Log security events
export const logSecurityEvent = (event: string, details: Record<string, any>) => {
  console.warn(`[SECURITY] ${event}:`, {
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    ...details
  });
};