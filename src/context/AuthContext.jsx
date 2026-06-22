import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setTokens, clearTokens } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const data = await api.post("/auth/refresh", undefined, { auth: false });
        if (cancelled) return;
        setTokens(data.accessToken);
        const me = await api.get("/auth/me");
        if (cancelled) return;
        setUser(me.user);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    const handleLogout = () => {
      setUser(null);
      clearTokens();
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => {
      cancelled = true;
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post("/auth/login", { email, password }, { auth: false });
    setTokens(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await api.post("/auth/register", { name, email, password }, { auth: false });
    setTokens(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
    } finally {
      setUser(null);
      clearTokens();
    }
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : updates));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
