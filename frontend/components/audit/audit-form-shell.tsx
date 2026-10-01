"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";

// Structure only. The text comes from the dictionaries, by convention:
//   audit.<type>.section.<id>                 section title
//   audit.<type>.field.<name>.label           question
//   audit.<type>.field.<name>.placeholder     example text, when the field has one
//   audit.<type>.option.<name>.<value>        answer choice
// Option values are the codes that are stored, so answers do not depend on the language.
export interface AuditField {
  name: string;
  type: "text" | "number" | "select" | "textarea";
  options?: string[];
  required?: boolean;
}

export interface AuditSection {
  id: string;
  fields: AuditField[];
}

interface AuditFormShellProps {
  auditType: string;
  sections: AuditSection[];
  initialData: Record<string, Record<string, string>>;
  onSave: (responses: Record<string, Record<string, string>>) => Promise<void>;
  onComplete: (responses: Record<string, Record<string, string>>) => Promise<void>;
  saving?: boolean;
}

export default function AuditFormShell({
  auditType,
  sections,
  initialData,
  onSave,
  onComplete,
  saving = false,
}: AuditFormShellProps) {
  const { t, tOr } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [responses, setResponses] = useState<Record<string, Record<string, string>>>(initialData);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"form" | "conversational">("form");
  // Names of the required fields left empty; the message is rendered in the current language
  const [missingFields, setMissingFields] = useState<Set<string>>(new Set());

  // Sync initial data when it loads
  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setResponses(initialData);
      // Mark sections as completed if they have data
      const completed = new Set<string>();
      sections.forEach((section) => {
        const sectionData = initialData[section.id];
        if (sectionData && Object.values(sectionData).some((v) => v !== "")) {
          completed.add(section.id);
        }
      });
      setCompletedSections(completed);
    }
  }, [initialData, sections]);

  const currentSection = sections[currentPage];
  const isLastPage = currentPage === sections.length - 1;
  const isFirstPage = currentPage === 0;

  const updateField = useCallback(
    (sectionId: string, fieldName: string, value: string) => {
      setResponses((prev) => ({
        ...prev,
        [sectionId]: {
          ...(prev[sectionId] || {}),
          [fieldName]: value,
        },
      }));
    },
    []
  );

  const sectionTitle = (section: AuditSection) => t(`audit.${auditType}.section.${section.id}`);
  const fieldLabel = (field: AuditField) => t(`audit.${auditType}.field.${field.name}.label`);
  const fieldPlaceholder = (field: AuditField) =>
    tOr(`audit.${auditType}.field.${field.name}.placeholder`, undefined);

  const validateCurrentSection = useCallback((): boolean => {
    const missing = new Set<string>();
    for (const field of currentSection.fields) {
      if (field.required) {
        const value = responses[currentSection.id]?.[field.name] ?? "";
        if (!value.trim()) {
          missing.add(field.name);
        }
      }
    }
    setMissingFields(missing);
    return missing.size === 0;
  }, [currentSection, responses]);

  const handleAutoSave = useCallback(async () => {
    try {
      await onSave(responses);
    } catch {
      // Silent save failure -- user can retry manually
    }
  }, [onSave, responses]);

  const handleNext = useCallback(async () => {
    if (!validateCurrentSection()) return;
    // Mark current section as completed
    setCompletedSections((prev) => new Set([...prev, currentSection.id]));
    // Auto-save on page transition
    await handleAutoSave();
    setCurrentPage((prev) => Math.min(prev + 1, sections.length - 1));
  }, [currentSection, handleAutoSave, sections.length, validateCurrentSection]);

  const handleBack = useCallback(() => {
    setMissingFields(new Set());
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleComplete = useCallback(async () => {
    if (!validateCurrentSection()) return;
    setCompletedSections((prev) => new Set([...prev, currentSection.id]));
    await onComplete(responses);
  }, [currentSection, onComplete, responses, validateCurrentSection]);

  const jumpToSection = useCallback(
    (index: number) => {
      const targetSection = sections[index];
      // Allow jumping to any completed section or the current one
      if (completedSections.has(targetSection.id) || index === currentPage) {
        setMissingFields(new Set());
        setCurrentPage(index);
      }
    },
    [completedSections, currentPage, sections]
  );

  const progressPercent = ((currentPage + 1) / sections.length) * 100;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground-strong">
            {t(`audit.${auditType}.name`)}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground-muted">
              {t("audit.shell.section_of", { current: currentPage + 1, total: sections.length })}
            </span>
            {/* Mode toggle placeholder */}
            <button
              type="button"
              onClick={() =>
                setMode((m) => (m === "form" ? "conversational" : "form"))
              }
              className="text-xs border border-border px-3 py-1.5 text-foreground-secondary hover:bg-surface-subtle"
              title={t("audit.shell.mode.coming_soon")}
              disabled
            >
              {t(`audit.shell.mode.${mode}`)}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-border h-2 rounded-full overflow-hidden">
          <div
            className="bg-amber-600 h-2 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Section tabs / jump navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {sections.map((section, index) => {
          const isCompleted = completedSections.has(section.id);
          const isCurrent = index === currentPage;
          const canJump = isCompleted || isCurrent;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => jumpToSection(index)}
              disabled={!canJump}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                isCurrent
                  ? "border-amber-600 text-amber-700 font-medium"
                  : isCompleted
                  ? "border-emerald-500 text-emerald-700 cursor-pointer hover:bg-surface-subtle"
                  : "border-transparent text-foreground-tertiary cursor-not-allowed"
              }`}
            >
              {isCompleted && !isCurrent && (
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {sectionTitle(section)}
            </button>
          );
        })}
      </div>

      {/* Current section form */}
      <div className="bg-surface-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground-strong mb-6">
          {sectionTitle(currentSection)}
        </h2>

        <div className="space-y-5">
          {currentSection.fields.map((field) => {
            const label = fieldLabel(field);
            const placeholder = fieldPlaceholder(field);
            const fieldError = missingFields.has(field.name)
              ? t("audit.shell.required", { field: label })
              : null;
            const errorBorderClass = fieldError ? "border-red-400 dark:border-red-600" : "border-border";
            return (
            <div key={field.name}>
              <label
                htmlFor={`${currentSection.id}-${field.name}`}
                className="block text-sm font-medium text-foreground-secondary mb-1.5"
              >
                {label}
                {field.required && (
                  <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>
                )}
              </label>

              {field.type === "select" ? (
                <select
                  id={`${currentSection.id}-${field.name}`}
                  value={responses[currentSection.id]?.[field.name] ?? ""}
                  onChange={(e) =>
                    updateField(currentSection.id, field.name, e.target.value)
                  }
                  // A long answer wraps inside the closed control instead of being clipped on a
                  // phone (browsers without field-sizing keep the single line)
                  className={`w-full border ${errorBorderClass} px-3 py-2.5 text-sm text-foreground-strong bg-surface-card whitespace-normal field-sizing-content focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500`}
                >
                  <option value="">{t("audit.shell.select")}</option>
                  {field.options?.map((value) => (
                    <option key={value} value={value}>
                      {t(`audit.${auditType}.option.${field.name}.${value}`)}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  id={`${currentSection.id}-${field.name}`}
                  value={responses[currentSection.id]?.[field.name] ?? ""}
                  onChange={(e) =>
                    updateField(currentSection.id, field.name, e.target.value)
                  }
                  placeholder={placeholder}
                  rows={3}
                  className={`w-full border ${errorBorderClass} px-3 py-2.5 text-sm text-foreground-strong focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500`}
                />
              ) : field.type === "number" ? (
                <input
                  type="number"
                  id={`${currentSection.id}-${field.name}`}
                  value={responses[currentSection.id]?.[field.name] ?? ""}
                  onChange={(e) =>
                    updateField(currentSection.id, field.name, e.target.value)
                  }
                  placeholder={placeholder}
                  className={`w-full border ${errorBorderClass} px-3 py-2.5 text-sm text-foreground-strong focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500`}
                />
              ) : (
                <input
                  type="text"
                  id={`${currentSection.id}-${field.name}`}
                  value={responses[currentSection.id]?.[field.name] ?? ""}
                  onChange={(e) =>
                    updateField(currentSection.id, field.name, e.target.value)
                  }
                  placeholder={placeholder}
                  className={`w-full border ${errorBorderClass} px-3 py-2.5 text-sm text-foreground-strong focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500`}
                />
              )}
              {fieldError && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldError}</p>
              )}
            </div>
            );
          })}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={isFirstPage}
          className={`px-6 py-3 text-sm font-medium border border-border ${
            isFirstPage
              ? "text-foreground-tertiary cursor-not-allowed"
              : "text-foreground-secondary hover:bg-surface-subtle"
          }`}
        >
          {t("audit.shell.back")}
        </button>

        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-xs text-foreground-tertiary">{t("audit.shell.saving")}</span>
          )}

          {isLastPage ? (
            <button
              type="button"
              onClick={handleComplete}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-none font-medium text-sm disabled:opacity-50"
            >
              {t("audit.shell.complete")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-none font-medium text-sm disabled:opacity-50"
            >
              {t("audit.shell.next", { section: sectionTitle(sections[currentPage + 1]) })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
