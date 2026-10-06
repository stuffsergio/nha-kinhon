import rateLimit from "express-rate-limit";

const spanishMessage = { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." };

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Demasiados intentos. Intenta de nuevo en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: spanishMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export const confirmPaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: spanishMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export const deliveryLocationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: spanishMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export const deliveryPhotosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: spanishMessage,
  standardHeaders: true,
  legacyHeaders: false,
});
