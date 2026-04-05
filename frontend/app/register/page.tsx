"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, AuthProvider } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return t("auth.validation.invalid_email");
    }
    if (password.length < 8) {
      return t("auth.validation.password_too_short");
    }
    if (password !== confirmPassword) {
      return t("auth.validation.passwords_mismatch");
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
        setError(t("auth.error.generic"));
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
            {t("nav.brand")}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">
            {t("auth.register.title")}
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
            <span className="text-sm font-medium text-foreground">{t("auth.login.email_label")}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.login.email_placeholder")}
              autoComplete="email"
              className="h-10 border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
              style={{ borderRadius: "var(--radius-default)" }}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">
              {t("auth.login.password_label")}
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.register.password_placeholder")}
              autoComplete="new-password"
              className="h-10 border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
              style={{ borderRadius: "var(--radius-default)" }}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">
              {t("auth.register.confirm_label")}
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("auth.register.confirm_placeholder")}
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
            {submitting ? t("auth.register.submitting") : t("auth.register.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground-muted">
          {t("auth.register.has_account")}{" "}
          <Link
            href="/login"
            className="font-medium text-accent underline underline-offset-2 hover:text-accent-hover"
          >
            {t("auth.register.login_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
