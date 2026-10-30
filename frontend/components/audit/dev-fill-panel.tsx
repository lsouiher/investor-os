"use client";

/**
 * Dev-only persona fill panel, rendered by AuditFormShell only when NODE_ENV != production and
 * NEXT_PUBLIC_ENABLE_DEV_SEED=true (see the dynamic import there). It needs the backend's
 * ENABLE_DEV_SEED gate open too: the fixtures come from GET /dev/personas, and "Fill all audits"
 * posts to /dev/personas/:letter/fill-all, which completes the five audits through the same
 * PUT-equivalent service path (and so auto-starts synthesis like a real fifth completion).
 */
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import type { AuditSection } from "./audit-form-shell";

interface Persona {
  letter: string;
  doc_number: number;
  label: string;
  summary: string;
  audits: Record<string, Record<string, Record<string, string>>>;
}

interface FilledField {
  section: string;
  field: string;
  value: string;
}

interface DevFillPanelProps {
  auditType: string;
  sections: AuditSection[];
  onFillPage: (values: Record<string, Record<string, string>>) => void;
}

const STORAGE_KEY = "dev-fill-persona";

export default function DevFillPanel({ auditType, sections, onFillPage }: DevFillPanelProps) {
  const [personas, setPersonas] = useState<Persona[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filled, setFilled] = useState<FilledField[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setSelected(saved);
    } catch {
      /* session storage unavailable */
    }
    api
      .get<Persona[]>("/dev/personas")
      .then((list) => {
        setPersonas(list);
        setSelected((cur) => cur || list[0]?.letter || "");
      })
      .catch((err: Error) => setError(`Personas unavailable: ${err.message} (is ENABLE_DEV_SEED=true on the backend?)`));
  }, []);

  useEffect(() => {
    if (!selected) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, selected);
    } catch {
      /* ignore */
    }
  }, [selected]);

  const persona = useMemo(() => personas?.find((p) => p.letter === selected) ?? null, [personas, selected]);

  const labelFor = (section: string, field: string, value: string): string => {
    const def = sections.find((s) => s.id === section)?.fields.find((f) => f.name === field);
    const opt = def?.options?.find((o) => o.value === value);
    return `${def?.label ?? field}: ${opt ? opt.label : value || "(empty)"}`;
  };

  const fillThisPage = () => {
    if (!persona) return;
    const values = persona.audits[auditType] ?? {};
    const list: FilledField[] = [];
    for (const section of sections) {
      for (const field of section.fields) {
        const value = values[section.id]?.[field.name];
        if (value !== undefined) list.push({ section: section.id, field: field.name, value });
      }
    }
    onFillPage(values);
    setFilled(list);
    setNotice(`Filled ${list.length} fields on the ${auditType} audit from persona ${persona.letter}. Review each section, then Complete Audit.`);
  };

  const fillAll = async () => {
    if (!persona) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await api.post<{ persona: string; label: string; filled: Array<{ audit_type: string; version: number; fields: number }> }>(
        `/dev/personas/${persona.letter}/fill-all`,
        {}
      );
      setFilled([]);
      setNotice(
        `Completed all five audits for persona ${result.persona}: ` +
          result.filled.map((f) => `${f.audit_type} v${f.version} (${f.fields} fields)`).join(", ") +
          ". Identity synthesis has started — open the Hub."
      );
    } catch (err) {
      setNotice(`Fill all failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside
      className="fixed bottom-24 right-4 z-40 w-80 max-h-[70vh] overflow-y-auto border-2 border-warn bg-surface-card text-xs shadow-lg md:bottom-4"
      aria-label="Dev persona fill panel"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-accent-tint px-3 py-2 font-semibold text-foreground-strong"
      >
        <span>DEV · Persona fill</span>
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-3 p-3">
          {error && <p className="text-danger">{error}</p>}
          {!error && !personas && <p className="text-foreground-muted">Loading personas…</p>}
          {personas && (
            <>
              <label className="block">
                <span className="mb-1 block text-foreground-secondary">Persona</span>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full border border-border bg-surface-card px-2 py-1.5 text-foreground-strong"
                >
                  {personas.map((p) => (
                    <option key={p.letter} value={p.letter}>
                      {p.letter} — {p.label}
                    </option>
                  ))}
                </select>
              </label>
              {persona && <p className="text-foreground-muted">{persona.summary}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={fillThisPage}
                  disabled={!persona || busy}
                  className="flex-1 bg-accent px-2 py-1.5 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-50"
                >
                  Fill this page
                </button>
                <button
                  type="button"
                  onClick={fillAll}
                  disabled={!persona || busy}
                  className="flex-1 border border-border px-2 py-1.5 font-medium text-foreground-secondary hover:bg-surface-subtle disabled:opacity-50"
                >
                  {busy ? "Filling…" : "Fill all audits"}
                </button>
              </div>
              {notice && <p className="text-foreground-secondary">{notice}</p>}
              {filled.length > 0 && (
                <ul className="space-y-0.5 border-t border-border pt-2 text-foreground-muted">
                  {filled.map((f) => (
                    <li key={`${f.section}.${f.field}`}>
                      <span className="text-ink-faint">{f.section}.</span>
                      {labelFor(f.section, f.field, f.value)}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </aside>
  );
}
