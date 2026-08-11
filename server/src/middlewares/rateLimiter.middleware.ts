import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 auth requests per minute (per-email 2-attempt tracking enforces account lockout)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const resetTime = (req as any).rateLimit?.resetTime
      ? new Date((req as any).rateLimit.resetTime).getTime()
      : Date.now() + 60000;
    const remainingSeconds = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
    res.status(429).json({
      success: false,
      message: `Too many requests from this IP. Please try again after ${remainingSeconds} seconds.`,
      lockoutUntil: resetTime,
      remainingSeconds,
      attemptsLeft: 0,
    });
  },
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 OTP requests per hour
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait before requesting another code.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per 15 mins
  message: {
    success: false,
    message: 'Too many requests from this IP. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
