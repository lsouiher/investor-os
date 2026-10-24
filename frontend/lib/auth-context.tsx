"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { clearSignupSource, takeSignupSource } from "@/lib/signup-source";
import { clearImport } from "@/lib/recs-import";
import { api } from "./api-client";

export interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Each validation gets a number; a reply for an older one is ignored (two quick switches)
  const validation = useRef(0);

  // Check the stored token and validate it: on mount, and whenever another tab signs in or out
  const validateStoredToken = useCallback(() => {
    const run = ++validation.current;
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    // Until /auth/me answers, show no account: the API client already sends the new token, so a
    // page showing the previous user would act for someone else
    setToken(storedToken);
    setUser(null);
    setLoading(true);

    api
      .get<User>("/auth/me")
      .then((userData) => {
        if (run !== validation.current) return;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      })
      .catch(() => {
        if (run !== validation.current) return;
        // Token invalid — clear everything
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (run === validation.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    validateStoredToken();
  }, [validateStoredToken]);

  // A sign-in or sign-out in another tab: a page left open (e.g. /import) must not act for a
  // stale identity. key is null when another tab clears all of localStorage.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === "token" || event.key === null) validateStoredToken();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [validateStoredToken]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ token: string; user: User }>(
      "/auth/login",
      { email, password }
    );
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    setToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ token: string; user: User }>(
      "/auth/register",
      { email, password, signup_source: takeSignupSource() }
    );
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // A shared device: the next person to sign in in this tab must not be offered this user's
    // held RECS deal or inherit their signup source
    clearImport();
    clearSignupSource();
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
