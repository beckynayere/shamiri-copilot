// Simple in-memory rate limiter
// For production, consider using Redis or a dedicated rate limiting service

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP
const MAX_REQUESTS_PER_HOUR = 50; // 50 requests per hour per IP

// In-memory store (note: resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if a request should be rate limited
 * @param identifier - Usually the client IP address
 * @returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(identifier: string): { 
  allowed: boolean; 
  remaining: number; 
  resetIn: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(identifier);
    return checkRateLimit(identifier);
  }
  
  if (!entry) {
    // First request from this identifier
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
      lastRequest: now,
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetIn: RATE_LIMIT_WINDOW_MS,
    };
  }
  
  // Check if within current window
  if (now < entry.resetTime) {
    if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
      const resetIn = entry.resetTime - now;
      return {
        allowed: false,
        remaining: 0,
        resetIn,
        retryAfter: Math.ceil(resetIn / 1000), // seconds
      };
    }
    entry.count++;
    entry.lastRequest = now;
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - entry.count,
      resetIn: entry.resetTime - now,
    };
  }
  
  // Window expired, reset
  entry.count = 1;
  entry.resetTime = now + RATE_LIMIT_WINDOW_MS;
  entry.lastRequest = now;
  
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - 1,
    resetIn: RATE_LIMIT_WINDOW_MS,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(req: NextRequest): string {
  // Check various headers for client IP (common in production)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnecting = req.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (cfConnecting) return cfConnecting;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return 'unknown';
}

// Need to import NextRequest for type
import type { NextRequest } from 'next/server';

/**
 * Exponential backoff for retries
 * @param attempt - Current retry attempt number (0-indexed)
 * @returns Delay in milliseconds
 */
export function getBackoffDelay(attempt: number): number {
  // Base delay: 1 second
  // Max delay: 30 seconds
  // Exponential: 1000 * 2^attempt
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
  // Add some jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

/**
 * Retry an async function with exponential backoff
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param onRetry - Optional callback when retrying
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry if it's not a 429 error
      if (!lastError.message.includes('429') && !lastError.message.includes('rate limit')) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      if (onRetry) {
        onRetry(attempt, lastError);
      }
      
      const delay = getBackoffDelay(attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
