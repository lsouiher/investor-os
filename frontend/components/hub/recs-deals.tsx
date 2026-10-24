"use client";

// "Deals from your calculators": deals sent from RECS and saved on /import, last on the hub
// (spec FR-5). The payload d is only passed back to RECS, never read here.
import { useEffect, useRef, useState } from "react";
import { RecsLink } from "@/components/shared/recs-link";
import { useTranslation } from "@/lib/i18n";
import { deleteRecsDeal, listRecsDeals, type RecsDeal } from "@/lib/recs-deals-api";
import { openInRecsUrl } from "@/lib/recs-import";

export function RecsDeals() {
  const { t, locale } = useTranslation();
  // null while loading or after a failed fetch: the hub's job is the audits, so render nothing
  const [deals, setDeals] = useState<RecsDeal[] | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const recsUrl = process.env.NEXT_PUBLIC_RECS_URL;

  useEffect(() => {
    listRecsDeals()
      .then(setDeals)
      .catch((err) => console.error("Could not load deals from RECS", err));
  }, []);

  // Optimistic: the row goes at once and comes back if the server refuses. Only this row comes
  // back: restoring the whole earlier list would also revive a row deleted in the meantime.
  async function handleDelete(id: string) {
    const before = deals;
    setConfirming(null);
    setDeals((current) => current?.filter((deal) => deal.id !== id) ?? null);
    // The row and its buttons unmount: keep keyboard focus in the section, not at the page top.
    // Deleting the last deal with no RECS address hides the section, so focus the page heading.
    const hidesSection = deals?.length === 1 && !recsUrl;
    (hidesSection ? document.querySelector<HTMLElement>("h1") : headingRef.current)?.focus();
    try {
      await deleteRecsDeal(id);
    } catch (err) {
      console.error("Could not delete the deal", err);
      setDeals((current) =>
        before && current ? before.filter((deal) => deal.id === id || current.some((c) => c.id === deal.id)) : before,
      );
    }
  }

  if (deals === null) return null;
  if (deals.length === 0 && !recsUrl) return null;

  return (
    <section className="mt-10">
      <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-foreground-strong">
        {t("hub.recs_deals.title")}
      </h2>

      {deals.length === 0 ? (
        <p className="mt-2 text-sm text-foreground-muted">
          {t("hub.recs_deals.empty")}{" "}
          <RecsLink className="font-medium text-accent-text underline underline-offset-2">
            {t("hub.recs_deals.empty_link")}
          </RecsLink>
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface-card">
          {deals.map((deal) => {
            const href = openInRecsUrl(recsUrl, deal.c, deal.d);
            return (
              <li key={deal.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="break-words font-medium text-foreground-strong">{deal.name}</p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    <span>{t(`recs.calculator.${deal.c}`)}</span>
                    <span aria-hidden="true"> · </span>
                    <span>
                      {t("hub.recs_deals.saved_on", { date: new Date(deal.created_at).toLocaleDateString(locale) })}
                    </span>
                  </p>
                </div>

                {confirming === deal.id ? (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-foreground-secondary">{t("hub.recs_deals.confirm_delete")}</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(deal.id)}
                      className="font-medium text-danger underline underline-offset-2"
                    >
                      {t("hub.recs_deals.confirm")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      autoFocus
                      className="text-foreground-muted underline underline-offset-2 hover:text-foreground-strong"
                    >
                      {t("hub.recs_deals.keep")}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-sm">
                    {href && (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-accent-text underline underline-offset-2"
                      >
                        {t("hub.recs_deals.open")}
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirming(deal.id)}
                      className="text-foreground-muted underline underline-offset-2 hover:text-danger"
                    >
                      {t("hub.recs_deals.delete")}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
