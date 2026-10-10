import rateLimit from "express-rate-limit";
import { translateError } from "../i18n/index.js";

function rateLimitHandler(code) {
  return (req, res) => {
    const locale = req.locale;
    res.status(429).json({
      error: translateError(code, locale),
      code,
    });
  };
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  handler: rateLimitHandler("RATE_LIMIT_AUTH"),
  standardHeaders: true,
  legacyHeaders: false,
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  handler: rateLimitHandler("RATE_LIMIT"),
  standardHeaders: true,
  legacyHeaders: false,
});

export const confirmPaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  handler: rateLimitHandler("RATE_LIMIT"),
  standardHeaders: true,
  legacyHeaders: false,
});

export const deliveryLocationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  handler: rateLimitHandler("RATE_LIMIT"),
  standardHeaders: true,
  legacyHeaders: false,
});

export const deliveryPhotosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  handler: rateLimitHandler("RATE_LIMIT"),
  standardHeaders: true,
  legacyHeaders: false,
});
