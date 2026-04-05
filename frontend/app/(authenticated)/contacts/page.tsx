"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import ContactFormModal from "@/components/contacts/contact-form";
import { ContactsEmpty } from "@/components/shared/empty-states";
import { SkeletonCard } from "@/components/shared/loading-states";
import AiErrorState from "@/components/shared/ai-error-state";
import { useTranslation } from "@/lib/i18n";

// Shape of GET /api/v1/contacts items (snake_case per contracts/api-v1.md)
interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role_type: string;
  notes: string | null;
  strategy_relevance: string | null;
  network_gap_filled: string | null;
  last_contacted_at: string | null;
}

const ROLE_KEYS = ["all", "agent", "lender", "contractor", "attorney", "cpa", "mentor", "partner", "seller", "property_manager", "other"];

function useRoleTypes() {
  const { t } = useTranslation();
  return ROLE_KEYS.map((key) => ({ key, label: t(`contacts.filter.${key}`) }));
}

function lastContactedBadge(lastContacted: string | null, t: (key: string, params?: Record<string, string | number>) => string): {
  label: string;
  className: string;
} {
  if (!lastContacted) {
    return { label: t("contacts.last_contacted.never"), className: "bg-surface-subtle text-foreground-muted" };
  }
  const days = Math.floor(
    (Date.now() - new Date(lastContacted).getTime()) / (1000 * 60 * 60 * 24)
  );
  const label = t("contacts.last_contacted.days_ago", { days: String(days) });
  if (days <= 7) {
    return { label, className: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" };
  }
  if (days <= 30) {
    return { label, className: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" };
  }
  return { label, className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" };
}

export default function ContactsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl space-y-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      }
    >
      <ContactsPageContent />
    </Suspense>
  );
}

function ContactsPageContent() {
  const { t } = useTranslation();
  const ROLE_TYPES = useRoleTypes();
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Contact[]>("/contacts");
      setContacts(data);
    } catch {
      setError(t("contacts.error.load_failed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setShowForm(true);
    }
  }, [searchParams]);

  const handleSave = async (contactData: {
    name: string;
    email: string;
    phone: string;
    role_type: string;
    notes: string;
  }) => {
    try {
      if (editingContact) {
        const updated = await api.put<Contact>(
          `/contacts/${editingContact.id}`,
          contactData
        );
        setContacts((prev) =>
          prev.map((c) => (c.id === editingContact.id ? updated : c))
        );
      } else {
        const created = await api.post<Contact>("/contacts", contactData);
        setContacts((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setEditingContact(null);
    } catch (err) {
      const message = t("contacts.error.save_failed");
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const filteredContacts =
    activeFilter === "all"
      ? contacts
      : contacts.filter((c) => c.role_type === activeFilter);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    );
  }

  if (contacts.length === 0 && !error) {
    return (
      <div className="mx-auto max-w-5xl">
        <ContactsEmpty />
        {showForm && (
          <ContactFormModal
            onSave={handleSave}
            onClose={() => {
              setShowForm(false);
              setEditingContact(null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground-strong">{t("contacts.title")}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {t("contacts.subtitle", { count: String(contacts.length) })}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingContact(null);
            setShowForm(true);
          }}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          {t("contacts.add")}
        </button>
      </div>

      {error && <AiErrorState severity="low" message={error} />}

      {/* Role type filter tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {ROLE_TYPES.map((role) => (
          <button
            key={role.key}
            onClick={() => setActiveFilter(role.key)}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === role.key
                ? "bg-amber-600 text-white"
                : "bg-surface-subtle text-foreground-secondary hover:bg-border"
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* Contact list */}
      <div className="space-y-2">
        {filteredContacts.map((contact) => {
          const badge = lastContactedBadge(contact.last_contacted_at, t);
          return (
            <button
              key={contact.id}
              onClick={() => handleEdit(contact)}
              className="flex w-full items-center gap-4 rounded-lg border border-border bg-surface-card p-4 text-left transition-colors hover:border-border"
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-sm font-bold text-amber-700 dark:text-amber-300">
                {contact.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground-strong">
                    {contact.name}
                  </p>
                  <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-xs text-foreground-muted">
                    {contact.role_type}
                  </span>
                </div>
                <p className="text-xs text-foreground-muted">
                  {contact.email || contact.phone || t("contacts.no_info")}
                </p>
              </div>

              {/* Gap filled by this contact */}
              {contact.network_gap_filled && (
                <div className="text-right">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t("contacts.fills_gap")}</p>
                  <p className="text-xs text-foreground-tertiary">{t(`contacts.role.${contact.network_gap_filled}`)}</p>
                </div>
              )}

              {/* Last contacted badge */}
              <span
                className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
              >
                {badge.label}
              </span>
            </button>
          );
        })}

        {filteredContacts.length === 0 && (
          <p className="py-8 text-center text-sm text-foreground-tertiary">
            {t("contacts.empty_filter")}
          </p>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <ContactFormModal
          contact={editingContact}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingContact(null);
          }}
        />
      )}
    </div>
  );
}
