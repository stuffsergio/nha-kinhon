const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

let accessToken = null;
let refreshPromise = null;

function getAccessToken() {
  return accessToken;
}

function setAccessToken(token) {
  accessToken = token;
}

async function refreshAccessToken() {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    setAccessToken(null);
    window.dispatchEvent(new Event("auth:logout"));
    return null;
  }

  const data = await res.json();
  setAccessToken(data.accessToken);
  return data.accessToken;
}

async function request(endpoint, options = {}) {
  const { method = "GET", body, params, auth = true } = options;

  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") search.append(k, v);
    });
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth) {
    if (!refreshPromise) refreshPromise = refreshAccessToken();
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, {
        method,
        headers,
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
      });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error de conexión" }));
    throw new Error(err.error || `Error ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: (endpoint, opts = {}) => request(endpoint, { ...opts, method: "GET" }),
  post: (endpoint, body, opts = {}) =>
    request(endpoint, { ...opts, method: "POST", body }),
  put: (endpoint, body, opts = {}) =>
    request(endpoint, { ...opts, method: "PUT", body }),
  del: (endpoint, opts = {}) => request(endpoint, { ...opts, method: "DELETE" }),
};

export function setTokens(newAccessToken) {
  setAccessToken(newAccessToken);
}

export function clearTokens() {
  setAccessToken(null);
}
