import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../services/api", () => {
  let accessToken = null;

  async function refreshAccessToken() {
    const res = await fetch("http://localhost:3000/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      accessToken = null;
      window.dispatchEvent(new Event("auth:logout"));
      return null;
    }
    const data = await res.json();
    accessToken = data.accessToken;
    return data.accessToken;
  }

  async function request(endpoint, options = {}) {
    const { method = "GET", body, params, auth = true } = options;

    let url = `http://localhost:3000/api${endpoint}`;
    if (params) {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") search.append(k, v);
      });
      const qs = search.toString();
      if (qs) url += `?${qs}`;
    }

    const headers = { "Content-Type": "application/json" };
    if (auth && accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    let res = await fetch(url, {
      method,
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && auth) {
      const newToken = await refreshAccessToken();
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

  return {
    api: {
      get: (endpoint, opts = {}) => request(endpoint, { ...opts, method: "GET" }),
      post: (endpoint, body, opts = {}) => request(endpoint, { ...opts, method: "POST", body }),
      put: (endpoint, body, opts = {}) => request(endpoint, { ...opts, method: "PUT", body }),
      del: (endpoint, opts = {}) => request(endpoint, { ...opts, method: "DELETE" }),
    },
    setTokens: (token) => { accessToken = token; },
    clearTokens: () => { accessToken = null; },
  };
});

import { api, setTokens, clearTokens } from "../../../services/api";

describe("api service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTokens();
    global.fetch = vi.fn();
  });

  it("should make GET request", async () => {
    const mockData = { data: "test" };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await api.get("/test");
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/test",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("should make POST request with body", async () => {
    const mockData = { id: 1 };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await api.post("/test", { name: "test" });
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/test",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "test" }),
      })
    );
  });

  it("should include auth header when token is set", async () => {
    setTokens("test-token");
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await api.get("/me");

    const callArgs = global.fetch.mock.calls[0];
    const headers = callArgs[1].headers;
    expect(headers["Authorization"]).toBe("Bearer test-token");
  });

  it("should throw on non-ok response", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Bad request" }),
    });

    await expect(api.get("/bad")).rejects.toThrow("Bad request");
  });
});
