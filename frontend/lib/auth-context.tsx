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

// Reloads the page (an object so tests can replace it; jsdom cannot navigate)
export const page = { reload: () => window.location.reload() };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Check the stored token once, on mount
  useEffect(() => {
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    function validate() {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        setLoading(false);
        return;
      }
      setToken(storedToken);
      // A reply for a token since replaced is ignored: a sign-in in this tab already set the
      // account, and a change from another tab reloads the page. A removed token is not replaced
      // (the API client clears it on a 401).
      const superseded = () => {
        const current = localStorage.getItem("token");
        return cancelled || (current !== null && current !== storedToken);
      };
      api
        .get<User>("/auth/me")
        .then((userData) => {
          if (superseded()) return;
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
          setLoading(false);
        })
        .catch((err: { code?: string }) => {
          if (superseded()) return;
          if (err?.code === "UNAUTHORIZED") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setToken(null);
            setLoading(false);
            return;
          }
          // A server or network failure is not a signed-out user: keep the token (removing it would
          // also sign out every other tab) and check again, still loading
          retry = setTimeout(() => {
            if (!superseded()) validate();
          }, 5000);
        });
    }
    validate();
    return () => {
      cancelled = true;
      clearTimeout(retry);
    };
  }, []);

  // A sign-in or sign-out in another tab: reload, so no page keeps showing or acting for the
  // previous account (forms, dashboard, /import). key is null when another tab clears all of
  // localStorage.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== "token" && event.key !== null) return;
      const stored = localStorage.getItem("token");
      if (stored === tokenRef.current) return;
      if (!stored && tokenRef.current) {
        // Signed out elsewhere: forget this tab's held RECS deal and signup source too (they
        // survive a reload), so the next person on a shared device is not offered them
        clearImport();
        clearSignupSource();
      }
      page.reload();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ token: string; user: User }>(
      "/auth/login",
      { email, password }
    );
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    setToken(result.token);
    setUser(result.user);
    setLoading(false); // a check still running for an older token ignores its reply
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
    setLoading(false); // a check still running for an older token ignores its reply
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
