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

// The account a token belongs to: its sub claim, the user's public id (User.id). Read without
// verifying the signature: only used to compare with the account already shown, never to trust.
function tokenSubject(token: string): string | null {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const sub = (JSON.parse(atob(payload)) as { sub?: unknown }).sub;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Each validation gets a number; a reply for an older one is ignored (two quick switches)
  const validation = useRef(0);
  const currentUser = useRef<User | null>(null);
  // This tab has shown a signed-in account since its held RECS deal was last cleared
  const hadSession = useRef(false);
  useEffect(() => {
    currentUser.current = user;
  }, [user]);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validateRef = useRef<() => void>(() => {});

  // Check the stored token and validate it: on mount, and whenever another tab signs in or out
  const validateStoredToken = useCallback(() => {
    const run = ++validation.current;
    if (retry.current) clearTimeout(retry.current);
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      // Signed out in another tab: forget this tab's held RECS deal and signup source too, so the
      // next person on a shared device is not offered them. A visitor never signed in keeps theirs.
      if (hadSession.current) {
        clearImport();
        clearSignupSource();
        hadSession.current = false;
      }
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    // Same account signed in again (in another tab): take the new token and keep the pages, so
    // unsaved forms survive
    const shown = currentUser.current;
    if (shown && tokenSubject(storedToken) === shown.id) {
      setToken(storedToken);
      setUser(shown); // a switch away just before may already have cleared it
      setLoading(false); // this supersedes any check still running, which would have cleared it
      return;
    }

    // Another account (or unknown): show none until /auth/me answers, and load, so the
    // authenticated layout remounts every page and none keeps the previous account's data (forms,
    // dashboard) while the API client already sends the new token
    setToken(storedToken);
    setUser(null);
    setLoading(true);

    api
      .get<User>("/auth/me")
      .then((userData) => {
        if (run !== validation.current) return;
        hadSession.current = true;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        setLoading(false);
      })
      .catch((err: { code?: string }) => {
        if (run !== validation.current) return;
        if (err?.code === "UNAUTHORIZED") {
          // Token invalid. Another tab may already have stored a newer one, whose storage event
          // this tab has not handled yet: leave it and check that one instead
          if (localStorage.getItem("token") !== storedToken) {
            validateRef.current();
            return;
          }
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
          setLoading(false);
          return;
        }
        // A server or network failure is not a signed-out user: keep the token (removing it would
        // also sign out every other tab) and check again, still loading
        retry.current = setTimeout(() => {
          if (run === validation.current) validateRef.current();
        }, 5000);
      });
  }, []);
  useEffect(() => {
    validateRef.current = validateStoredToken;
  }, [validateStoredToken]);

  useEffect(
    () => () => {
      // Unmounted: a reply still on its way must neither retry nor write storage
      validation.current++;
      if (retry.current) clearTimeout(retry.current);
    },
    [],
  );

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
    // Only now: a failed attempt must not cancel the check of the stored session; a check still
    // running for an older token must not undo this one
    validation.current++;
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    hadSession.current = true;
    setToken(result.token);
    setUser(result.user);
    setLoading(false); // the check this sign-in superseded will not clear it
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ token: string; user: User }>(
      "/auth/register",
      { email, password, signup_source: takeSignupSource() }
    );
    // Only now: a failed attempt must not cancel the check of the stored session; a check still
    // running for an older token must not undo this one
    validation.current++;
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    hadSession.current = true;
    setToken(result.token);
    setUser(result.user);
    setLoading(false); // the check this sign-in superseded will not clear it
  }, []);

  const logout = useCallback(() => {
    validation.current++;
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
