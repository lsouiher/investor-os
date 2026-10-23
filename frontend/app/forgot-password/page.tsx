"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
import { SiteHeader } from "@/components/shared/site-header";
import { useTranslation } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("auth.validation.invalid_email"));
      return;
    }
    setSubmitting(true);
    try {
      // The API answers the same whether or not the address exists (no account enumeration)
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.error.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md border border-border bg-surface-card p-8" style={{ borderRadius: "var(--radius-card)" }}>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">{t("auth.forgot.title")}</h1>
          </div>

          {sent ? (
            <p className="text-sm text-foreground-muted" role="status">
              {t("auth.forgot.sent")}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-foreground-muted">{t("auth.forgot.description")}</p>
              {error && (
                <div className="bg-danger-tint px-4 py-3 text-sm text-danger" style={{ borderRadius: "var(--radius-default)" }}>
                  {error}
                </div>
              )}
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">{t("auth.login.email_label")}</span>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.login.email_placeholder")}
                  autoComplete="email"
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
                {submitting ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-foreground-muted">
            <Link href="/login" className="font-medium text-accent-text underline underline-offset-2">
              {t("auth.forgot.back_to_login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
