// Simple in-memory rate limiter
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store rate limit entries by IP address
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(ip);
    }
  }
}, 60000);

interface RateLimitOptions {
  windowMs?: number; // Window size in milliseconds (default: 15 minutes)
  max?: number; // Max requests per window (default: 5)
  message?: string; // Error message
}

export function createRateLimiter(options: RateLimitOptions = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 5,
    message = "Too many requests, please try again later",
  } = options;

  return (req: Request): Response | null => {
    // Disable rate limiting in test environment
    if (process.env.NODE_ENV === "test" || process.env.BUN_ENV === "test") {
      return null;
    }
    // Extract IP address from request
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const now = Date.now();
    const resetTime = now + windowMs;

    // Get or create rate limit entry
    let entry = rateLimitStore.get(ip);

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      entry = { count: 1, resetTime };
      rateLimitStore.set(ip, entry);
      return null; // Allow request
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return new Response(JSON.stringify({ error: message }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(max),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(entry.resetTime),
        },
      });
    }

    return null; // Allow request
  };
}

// Pre-configured rate limiters for different endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: "Too many authentication attempts, please try again later",
});

export const strictAuthRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: "Too many failed login attempts, please try again later",
});
