"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useTranslation } from "@/lib/i18n";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t("auth.validation.password_too_short"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.validation.passwords_mismatch"));
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.error.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "h-10 border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent";

  return (
    <div className="relative flex flex-1 items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md bg-surface-card p-8 shadow-sm" style={{ borderRadius: "var(--radius-card)" }}>
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase text-accent">{t("nav.brand")}</p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">{t("auth.reset.title")}</h1>
        </div>

        {!token ? (
          <p className="text-sm text-foreground-muted">{t("auth.reset.missing_token")}</p>
        ) : done ? (
          <p className="text-sm text-foreground-muted" role="status">
            {t("auth.reset.done")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-score-red/10 px-4 py-3 text-sm text-score-red" style={{ borderRadius: "var(--radius-default)" }}>
                {error}
              </div>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">{t("auth.reset.password_label")}</span>
              <input
                id="reset-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.register.password_placeholder")}
                autoComplete="new-password"
                className={inputClass}
                style={{ borderRadius: "var(--radius-default)" }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">{t("auth.register.confirm_label")}</span>
              <input
                id="reset-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("auth.register.confirm_placeholder")}
                autoComplete="new-password"
                className={inputClass}
                style={{ borderRadius: "var(--radius-default)" }}
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 h-10 bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              {submitting ? t("auth.reset.submitting") : t("auth.reset.submit")}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-foreground-muted">
          <Link href="/login" className="font-medium text-accent underline underline-offset-2 hover:text-accent-hover">
            {t("auth.forgot.back_to_login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
