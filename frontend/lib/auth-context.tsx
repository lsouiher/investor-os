"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { takeSignupSource } from "@/lib/signup-source";
import { useTranslation } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";
import { api } from "./api-client";

export interface User {
  id: string;
  email: string;
  role: string;
  locale: Locale;
}

// Before accounts had a language (v0.3.2), the switch stored its choice here
const LEGACY_LOCALE_KEY = "locale";

// One time per device: a French choice made before accounts had a language is saved to the
// account. Returns the account as it stands afterwards.
async function adoptLegacyLocale(account: User): Promise<User> {
  let legacy: string | null = null;
  try {
    legacy = localStorage.getItem(LEGACY_LOCALE_KEY);
  } catch {}
  if (legacy === null) return account;

  let adopted = account;
  if (legacy === "fr" && account.locale !== "fr") {
    try {
      adopted = await api.put<User>("/auth/me", { locale: "fr" });
    } catch {
      return account; // keep the key: the next sign-in tries again
    }
  }
  try {
    localStorage.removeItem(LEGACY_LOCALE_KEY);
  } catch {}
  return adopted;
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
  const { locale, setLocale } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Signed in, the account's language applies on every device. setLocale only switches this
  // device (interface + cookie); nothing is written back to the account.
  const signIn = useCallback(
    (account: User) => {
      localStorage.setItem("user", JSON.stringify(account));
      setUser(account);
      setLocale(account.locale);
    },
    [setLocale]
  );

  // On mount, check for existing token and validate it
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);

    api
      .get<User>("/auth/me")
      .then(adoptLegacyLocale)
      .then(signIn)
      .catch(() => {
        // Token invalid — clear everything
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [signIn]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ token: string; user: User }>(
      "/auth/login",
      { email, password }
    );
    localStorage.setItem("token", result.token);
    setToken(result.token);
    signIn(await adoptLegacyLocale(result.user));
  }, [signIn]);

  const register = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ token: string; user: User }>(
      "/auth/register",
      { email, password, signup_source: takeSignupSource(), locale }
    );
    localStorage.setItem("token", result.token);
    setToken(result.token);
    // A new account takes the language it was registered in; an older choice left on this
    // device has nothing to say about it
    try {
      localStorage.removeItem(LEGACY_LOCALE_KEY);
    } catch {}
    signIn(result.user);
  }, [locale, signIn]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
