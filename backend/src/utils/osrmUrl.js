const DEFAULT_OSRM_BASE = "https://router.project-osrm.org";

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateIpv4(host) {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  return false;
}

/**
 * Resolves OSRM base URL with SSRF guards in production.
 */
export function resolveOsrmBase(rawBase, isProduction = process.env.NODE_ENV === "production") {
  const candidate = (rawBase || DEFAULT_OSRM_BASE).trim();
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return DEFAULT_OSRM_BASE;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return DEFAULT_OSRM_BASE;
  }

  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".local")) {
    return isProduction ? DEFAULT_OSRM_BASE : candidate.replace(/\/$/, "");
  }
  if (isProduction && isPrivateIpv4(host)) {
    return DEFAULT_OSRM_BASE;
  }

  return candidate.replace(/\/$/, "");
}

export { DEFAULT_OSRM_BASE };
