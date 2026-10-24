"use client";

// A deal sent from a RECS calculator (RECS docs/spec.md §10.8, FR-10.8.2):
//   /import?ref=recs#c=<slug>&n=<name>&d=<payload>
// A client component on purpose (research R4): the deal is in the URL fragment, which never
// reaches a server, it is held in sessionStorage across sign-in, and the auth token lives in
// localStorage. Nothing about the deal is sent anywhere until the user presses Save.
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/shared/site-header";
import { useTranslation } from "@/lib/i18n";
import { rememberSignupSource } from "@/lib/signup-source";
import { saveRecsDeal } from "@/lib/recs-deals-api";
import { ApiError } from "@/lib/api-client";
import {
  clearImport,
  parseImportFragment,
  stashImport,
  takeImport,
  type RecsImport,
} from "@/lib/recs-import";

export default function ImportPage() {
  return (
    <AuthProvider>
      <ImportView />
    </AuthProvider>
  );
}

const primaryButton =
  "inline-flex h-10 items-center justify-center bg-accent px-5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-50";
const secondaryButton =
  "inline-flex h-10 items-center justify-center border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle";

function ImportView() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  const [deal, setDeal] = useState<RecsImport | null>(null);
  const [arrived, setArrived] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // null, or the locale key of the message to show
  const [error, setError] = useState<string | null>(null);

  // Arrival: hold the deal, record ?ref=, then take the deal out of the address bar so a reload
  // or a copied link cannot save it again. An invalid fragment leaves an existing stash alone.
  useEffect(() => {
    const arriving = parseImportFragment(window.location.hash);
    if (arriving) stashImport(arriving);
    rememberSignupSource(window.location.search);
    window.history.replaceState(null, "", "/import");
    setDeal(takeImport() ?? arriving);
    setArrived(true);
  }, []);

  async function handleSave() {
    if (!deal) return;
    setSaving(true);
    setError(null);
    try {
      await saveRecsDeal(deal);
      clearImport();
      setSaved(true);
    } catch (err) {
      // The stash stays, so Save can be retried (after deleting deals, for the per-user limit)
      setError(isLimitError(err) ? "import.limit" : "import.error");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    clearImport();
    router.push("/hub");
  }

  if (!arrived || loading) return <Shell>{null}</Shell>;

  if (saved) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-foreground">{t("import.title")}</h1>
        <p className="mt-4 text-sm text-foreground-secondary">{t("import.saved")}</p>
        <Link href="/hub" className={`mt-6 ${primaryButton}`} style={{ borderRadius: "var(--radius-button)" }}>
          {t("import.go_to_hub")}
        </Link>
      </Shell>
    );
  }

  if (!deal) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-foreground">{t("import.nothing_title")}</h1>
        <p className="mt-4 text-sm text-foreground-secondary">{t("import.nothing_body")}</p>
        <Link
          href={user ? "/hub" : "/"}
          className="mt-6 inline-block text-sm font-medium text-accent-text underline underline-offset-2"
        >
          {user ? t("import.nothing_link_hub") : t("import.nothing_link_home")}
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="text-sm text-foreground-muted">{t("import.title")}</p>
      {/* The name as received (after cleaning), rendered as text: never translated, never markup */}
      <h1 className="mt-2 break-words text-2xl font-bold text-foreground">{deal.name}</h1>
      <p className="mt-1 text-sm text-foreground-secondary">
        {t("import.from", { calculator: t(`recs.calculator.${deal.c}`) })}
      </p>

      {user ? (
        <>
          <p className="mt-6 text-sm text-foreground-muted">{t("import.signed_in_as", { email: user.email })}</p>
          {error && (
            <div
              role="alert"
              className="mt-4 bg-danger-tint px-4 py-3 text-sm text-danger"
              style={{ borderRadius: "var(--radius-default)" }}
            >
              {t(error)}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={primaryButton}
              style={{ borderRadius: "var(--radius-button)" }}
            >
              {saving ? t("import.saving") : t("import.save")}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className={secondaryButton}
              style={{ borderRadius: "var(--radius-button)" }}
            >
              {t("import.cancel")}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-6 text-sm text-foreground-secondary">{t("import.signed_out_hint")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/login?next=/import" className={primaryButton} style={{ borderRadius: "var(--radius-button)" }}>
              {t("import.sign_in")}
            </Link>
            <Link href="/register?next=/import" className={secondaryButton} style={{ borderRadius: "var(--radius-button)" }}>
              {t("import.create_account")}
            </Link>
          </div>
        </>
      )}
    </Shell>
  );
}

function isLimitError(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    Array.isArray(err.details) &&
    err.details.some((detail) => (detail as { field?: string })?.field === "limit")
  );
}

// Same shell as /login: signed-out header band, one centred card
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        {children && (
          <div
            className="w-full max-w-md border border-border bg-surface-card p-8"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
