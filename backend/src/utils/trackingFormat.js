import { toLeanTracking, toPublicTracking } from "./orderTracking.js";

/** Clients may request a smaller tracking JSON via query or Accept. */
export function wantsLeanTracking(req) {
  const fields = String(req.query?.fields ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (fields.includes("lean")) return true;

  const acceptHeader =
    typeof req.get === "function" ? req.get("Accept") : req.headers?.accept;
  const accept = String(acceptHeader ?? "").toLowerCase();
  if (accept.includes("application/vnd.nhakinhon.tracking.lean+json")) return true;
  if (accept.includes("application/vnd.nhakinhon.tracking+json") && accept.includes("variant=lean")) {
    return true;
  }
  return false;
}

export function formatTrackingHttpBody(tracking, { lean = false } = {}) {
  const publicTracking = toPublicTracking(tracking);
  if (!lean) {
    return { tracking: publicTracking };
  }
  return { tracking: toLeanTracking(publicTracking), lean: true };
}
