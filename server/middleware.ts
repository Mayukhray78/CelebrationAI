import { Request, Response, NextFunction } from 'express';

/**
 * Enhanced HTTP Security Headers Middleware.
 * Protects against MIME-sniffing, clickjacking, and XSS attacks.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Prevent browsers from MIME-sniffing a response away from declared content-type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking by restricting framing to same-origin
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Enable XSS filtering built into modern browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information sent in requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict access to browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Strip information about the server platform
  res.removeHeader('X-Powered-By');

  // Strict-Transport-Security if on HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

/**
 * Production-ready CORS options and validation.
 */
export function configureCors(allowedOriginsEnv?: string) {
  const allowedOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'];

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;

    if (!origin) {
      // Same-origin or non-browser request (like curl or postman)
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV !== 'production'
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours preflight cache

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  };
}

/**
 * Sliding-window in-memory rate limiter per IP address.
 * Prevents API quota exhaustion, DoS attacks, and brute force requests.
 */
interface RateLimitRecord {
  timestamps: number[];
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const store = new Map<string, RateLimitRecord>();
  const { windowMs, maxRequests, message = 'Too many requests. Please try again later.' } = options;

  // Cleanup old records periodically every 3 minutes
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
      if (record.timestamps.length === 0) {
        store.delete(ip);
      }
    }
  }, 3 * 60 * 1000);

  if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    // Determine client IP safely
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || '127.0.0.1';

    const now = Date.now();
    let record = store.get(ip);
    if (!record) {
      record = { timestamps: [] };
      store.set(ip, record);
    }

    // Filter out timestamps outside window
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

    const remaining = Math.max(0, maxRequests - record.timestamps.length);
    const resetTime = Math.ceil(windowMs / 1000);

    res.setHeader('RateLimit-Limit', maxRequests.toString());
    res.setHeader('RateLimit-Remaining', remaining.toString());
    res.setHeader('RateLimit-Reset', resetTime.toString());

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const retryAfterSec = Math.ceil((oldest + windowMs - now) / 1000);
      res.setHeader('Retry-After', Math.max(1, retryAfterSec).toString());

      res.status(429).json({
        error: message,
        retryAfter: Math.max(1, retryAfterSec),
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}

/**
 * Centralized API error handler that masks secrets and internal stack traces.
 */
export function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Defensive check: never log strings containing possible raw API keys
  const sanitizedMessage = (err.message || 'Internal Server Error').replace(
    /AIza[0-9A-Za-z-_]{35}/g,
    '[REDACTED_API_KEY]',
  );

  console.error('[SERVER ERROR]', sanitizedMessage);

  if (res.headersSent) {
    return;
  }

  // Handle standard JSON parse errors from express.json()
  if ('type' in err && (err as any).type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON payload received.' });
    return;
  }

  // Handle payload too large
  if ('type' in err && (err as any).type === 'entity.too.large') {
    res.status(413).json({ error: 'Request payload exceeds allowable limit (500KB).' });
    return;
  }

  res.status(500).json({
    error: 'An internal error occurred while processing your celebration plan.',
    details: process.env.NODE_ENV === 'production' ? undefined : sanitizedMessage,
  });
}
