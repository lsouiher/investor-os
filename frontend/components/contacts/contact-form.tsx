"use client";

import { useTranslation } from "@/lib/i18n";
import { useState, useEffect, useRef } from "react";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role_type: string;
  notes: string | null;
}

interface ContactFormModalProps {
  contact?: Contact | null;
  onSave: (data: {
    name: string;
    email: string;
    phone: string;
    role_type: string;
    notes: string;
  }) => void;
  onClose: () => void;
}

// Must match the ContactRoleType enum on the backend
const ROLE_VALUES = ["agent", "lender", "contractor", "attorney", "cpa", "mentor", "partner", "seller", "property_manager", "other"];

function useRoleOptions() {
  const { t } = useTranslation();
  return ROLE_VALUES.map((value) => ({ value, label: t(`contacts.role.${value}`) }));
}

export default function ContactFormModal({
  contact,
  onSave,
  onClose,
}: ContactFormModalProps) {
  const { t } = useTranslation();
  const ROLE_OPTIONS = useRoleOptions();
  const [name, setName] = useState(contact?.name ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [roleType, setRoleType] = useState(contact?.role_type ?? "agent");
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), email, phone, role_type: roleType, notes });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("contacts.error.save_failed")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-surface-card p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground-strong">
            {contact ? t("contacts.form.edit_title") : t("contacts.form.add_title")}
          </h2>
          <button
            onClick={onClose}
            className="text-foreground-tertiary hover:text-foreground-secondary"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-700 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground-secondary">
              {t("contacts.form.name_label")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground-strong placeholder:text-foreground-tertiary focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder={t("contacts.form.name_placeholder")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground-secondary">
              {t("contacts.form.email_label")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground-strong placeholder:text-foreground-tertiary focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder={t("contacts.form.email_placeholder")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground-secondary">
              {t("contacts.form.phone_label")}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground-strong placeholder:text-foreground-tertiary focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder={t("contacts.form.phone_placeholder")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground-secondary">
              {t("contacts.form.role_label")}
            </label>
            <select
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground-strong focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground-secondary">
              {t("contacts.form.notes_label")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground-strong placeholder:text-foreground-tertiary focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder={t("contacts.form.notes_placeholder")}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
            >
              {saving ? t("contacts.form.saving") : contact ? t("contacts.form.update") : t("contacts.form.submit")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground-secondary transition-colors hover:bg-surface-subtle"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
