"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import ContactFormModal from "@/components/contacts/contact-form";
import { ContactsEmpty } from "@/components/shared/empty-states";
import { SkeletonCard } from "@/components/shared/loading-states";
import AiErrorState from "@/components/shared/ai-error-state";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role_type: string;
  notes: string | null;
  network_score: number | null;
  last_contacted: string | null;
}

const ROLE_TYPES = [
  { key: "all", label: "All" },
  { key: "agent", label: "Agents" },
  { key: "lender", label: "Lenders" },
  { key: "contractor", label: "Contractors" },
  { key: "mentor", label: "Mentors" },
  { key: "partner", label: "Partners" },
  { key: "other", label: "Other" },
];

function lastContactedBadge(lastContacted: string | null): {
  label: string;
  className: string;
} {
  if (!lastContacted) {
    return { label: "Never", className: "bg-gray-100 text-gray-500" };
  }
  const days = Math.floor(
    (Date.now() - new Date(lastContacted).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 7) {
    return { label: `${days}d ago`, className: "bg-emerald-100 text-emerald-700" };
  }
  if (days <= 30) {
    return { label: `${days}d ago`, className: "bg-amber-100 text-amber-700" };
  }
  return { label: `${days}d ago`, className: "bg-red-100 text-red-700" };
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
      setError("Failed to load contacts.");
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
      const message = "Failed to save contact.";
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
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your real estate network ({contacts.length} contacts)
          </p>
        </div>
        <button
          onClick={() => {
            setEditingContact(null);
            setShowForm(true);
          }}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          Add Contact
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
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* Contact list */}
      <div className="space-y-2">
        {filteredContacts.map((contact) => {
          const badge = lastContactedBadge(contact.last_contacted);
          return (
            <button
              key={contact.id}
              onClick={() => handleEdit(contact)}
              className="flex w-full items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-gray-300"
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                {contact.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {contact.name}
                  </p>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                    {contact.role_type}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {contact.email || contact.phone || "No contact info"}
                </p>
              </div>

              {/* Network score */}
              {contact.network_score != null && (
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-600">
                    {contact.network_score}
                  </p>
                  <p className="text-xs text-gray-400">Score</p>
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
          <p className="py-8 text-center text-sm text-gray-400">
            No contacts matching this filter.
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
