"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, AuthProvider } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}

function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex flex-1 items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div
        className="w-full max-w-md bg-surface-card p-8 shadow-sm"
        style={{ borderRadius: "var(--radius-card)" }}
      >
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase text-accent">
            InvestorOS
          </p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">
            Welcome back
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div
              className="bg-score-red/10 px-4 py-3 text-sm text-score-red"
              style={{ borderRadius: "var(--radius-default)" }}
            >
              {error}
            </div>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="h-10 border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
              style={{ borderRadius: "var(--radius-default)" }}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              className="h-10 border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
              style={{ borderRadius: "var(--radius-default)" }}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 h-10 bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            style={{ borderRadius: "var(--radius-button)" }}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-accent underline underline-offset-2 hover:text-accent-hover"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
