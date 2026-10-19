import * as Sentry from "@sentry/node";

const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
]);

const SENSITIVE_FIELD_NAMES = new Set([
  "password",
  "currentpassword",
  "newpassword",
  "email",
  "phone",
  "address",
  "recipientaddress",
  "recipientphone",
  "recipientname",
  "authorization",
  "cookie",
  "cookies",
  "accesstoken",
  "refreshtoken",
  "token",
]);

const REDACTED = "[Redacted]";

function scrubValue(key, value) {
  if (value == null) return value;
  const normalized = String(key).toLowerCase().replace(/[_-]/g, "");
  if (SENSITIVE_FIELD_NAMES.has(normalized)) return REDACTED;
  if (typeof value === "string" && value.length > 500) {
    return `${value.slice(0, 64)}…[truncated]`;
  }
  return value;
}

function scrubObjectDeep(value, depth = 0) {
  if (depth > 8 || value == null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => scrubObjectDeep(item, depth + 1));
  }
  if (typeof value !== "object") return value;
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    out[key] = scrubObjectDeep(scrubValue(key, val), depth + 1);
  }
  return out;
}

function scrubSentryEvent(event) {
  if (event.request) {
    if (event.request.headers) {
      const headers = { ...event.request.headers };
      for (const name of Object.keys(headers)) {
        if (SENSITIVE_HEADER_NAMES.has(name.toLowerCase())) {
          headers[name] = REDACTED;
        }
      }
      event.request.headers = headers;
    }
    if (event.request.data) {
      try {
        const parsed =
          typeof event.request.data === "string"
            ? JSON.parse(event.request.data)
            : event.request.data;
        event.request.data = scrubObjectDeep(parsed);
      } catch {
        event.request.data = REDACTED;
      }
    }
    if (event.request.cookies) {
      event.request.cookies = REDACTED;
    }
  }
  if (event.user) {
    event.user = scrubObjectDeep(event.user);
  }
  if (event.extra) {
    event.extra = scrubObjectDeep(event.extra);
  }
  return event;
}

export function isSentryEnabled() {
  return Boolean(process.env.SENTRY_DSN?.trim());
}

export function initSentry() {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: process.env.APP_ENV || process.env.NODE_ENV || "development",
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    beforeSend: scrubSentryEvent,
  });

  return true;
}

export function registerSentryExpressErrorHandler(app) {
  if (!isSentryEnabled()) return;
  Sentry.setupExpressErrorHandler(app);
}

export { Sentry };
