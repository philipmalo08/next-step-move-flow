import { z } from 'zod';
import { sanitizeEmail, sanitizePhone, sanitizeAddress, sanitizeText } from "./sanitization";

// Address validation schema
export const addressSchema = z.object({
  id: z.string().min(1, 'Address ID is required'),
  address: z.string()
    .min(3, 'Address must be at least 3 characters')
    .max(500, 'Address too long')
    .regex(/^[a-zA-Z0-9\s,.-]+$/, 'Address contains invalid characters'),
  type: z.enum(['pickup', 'dropoff'], {
    errorMap: () => ({ message: 'Type must be pickup or dropoff' })
  })
});

export const addressArraySchema = z.array(addressSchema)
  .min(2, 'At least 2 addresses required')
  .max(10, 'Too many addresses')
  .refine(
    (addresses) => addresses.some(addr => addr.type === 'pickup'),
    'At least one pickup address required'
  )
  .refine(
    (addresses) => addresses.some(addr => addr.type === 'dropoff'),
    'At least one dropoff address required'
  );

// Payment validation schema with enhanced security
export const paymentDataSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name too long')
    .transform(val => sanitizeText(val, 100)),
  email: z.string().email('Invalid email address')
    .transform(val => sanitizeEmail(val)),
  phone: z.string()
    .regex(/^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/, 'Invalid phone number')
    .transform(val => sanitizePhone(val)),
  billingAddress: z.string()
    .min(5, 'Billing address must be at least 5 characters')
    .max(500, 'Billing address too long')
    .transform(val => sanitizeAddress(val)),
  billingCity: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City name too long')
    .transform(val => sanitizeText(val, 100)),
  billingPostal: z.string()
    .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 'Invalid Canadian postal code')
    .transform(val => sanitizeText(val, 20))
});

// Booking data validation schema
export const bookingDataSchema = z.object({
  addresses: addressArraySchema,
  distance: z.number().min(0.1, 'Distance must be positive').max(10000, 'Distance too large'),
  selectedDate: z.date(),
  selectedTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  serviceTier: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().min(0),
    priceUnit: z.string()
  }),
  items: z.array(z.object({
    id: z.string(),
    name: z.string().max(200),
    category: z.string().max(100),
    weight: z.number().min(0).max(10000),
    volume: z.number().min(0).max(1000),
    quantity: z.number().min(1).max(100)
  })),
  quoteData: z.object({
    baseServiceFee: z.number().min(0),
    itemCost: z.number().min(0),
    distanceFee: z.number().min(0),
    subtotal: z.number().min(0),
    gst: z.number().min(0),
    qst: z.number().min(0),
    total: z.number().min(0)
  }),
  paymentData: paymentDataSchema
});

// Basic validation helpers - minimal sanitization to preserve user input
export const sanitizeString = (input: string): string => {
  return input.trim();
};

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
};