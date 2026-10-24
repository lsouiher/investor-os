"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, AuthProvider } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";
import { SiteHeader } from "@/components/shared/site-header";
import { useTranslation } from "@/lib/i18n";
import { safeNextPath } from "@/lib/next-path";

export default function LoginPage() {
  return (
    <AuthProvider>
      {/* useSearchParams needs a Suspense boundary for the static build */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthProvider>
  );
}

function LoginForm() {
  const router = useRouter();
  // ?next=/import brings a visitor back to the deal they arrived with (allow-listed)
  const next = safeNextPath(useSearchParams().get("next"));
  const { login } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("auth.validation.invalid_email"));
      return;
    }
    if (!password) {
      setError(t("auth.validation.password_required"));
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      router.push(next ?? "/dashboard");
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
    <div className="flex flex-1 flex-col bg-background">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-md border border-border bg-surface-card p-8"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {t("auth.login.title")}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div
                className="bg-danger-tint px-4 py-3 text-sm text-danger"
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
                placeholder={t("auth.login.password_placeholder")}
                autoComplete="current-password"
                className="h-10 border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
                style={{ borderRadius: "var(--radius-default)" }}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 h-10 bg-accent text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-50"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              {submitting ? t("auth.login.submitting") : t("auth.login.submit")}
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            <Link href="/forgot-password" className="text-foreground-muted underline underline-offset-2 hover:text-accent-text">
              {t("auth.login.forgot_link")}
            </Link>
          </p>

          <p className="mt-4 text-center text-sm text-foreground-muted">
            {t("auth.login.no_account")}{" "}
            <Link
              href={next ? `/register?next=${next}` : "/register"}
              className="font-medium text-accent-text underline underline-offset-2"
            >
              {t("auth.login.create_link")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
