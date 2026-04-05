"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, AuthProvider } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";

export default function RegisterPage() {
  return (
    <AuthProvider>
      <RegisterForm />
    </AuthProvider>
  );
}

function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address.";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password);
      router.push("/hub");
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
    <div className="flex flex-1 items-center justify-center bg-background px-4">
      <div
        className="w-full max-w-md bg-surface-card p-8 shadow-sm"
        style={{ borderRadius: "var(--radius-card)" }}
      >
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase text-accent">
            InvestorOS
          </p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">
            Create your account
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
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="h-10 border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
              style={{ borderRadius: "var(--radius-default)" }}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">
              Confirm password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
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
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-accent underline underline-offset-2 hover:text-accent-hover"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
