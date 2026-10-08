import cors from "cors";
import { isOriginAllowed, isProduction, getAllowedClientOrigins } from "../config/runtime.js";

export function corsMiddleware() {
  return cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      if (isProduction && getAllowedClientOrigins().length === 0) {
        return callback(null, false);
      }

      if (!isProduction && getAllowedClientOrigins().length === 0) {
        return callback(null, true);
      }

      callback(null, false);
    },
    credentials: true,
  });
}
