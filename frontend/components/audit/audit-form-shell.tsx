"use client";

import { useState, useCallback, useEffect } from "react";

export interface AuditField {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

export interface AuditSection {
  id: string;
  title: string;
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
  const [currentPage, setCurrentPage] = useState(0);
  const [responses, setResponses] = useState<Record<string, Record<string, string>>>(initialData);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"form" | "conversational">("form");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

  const validateCurrentSection = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    for (const field of currentSection.fields) {
      if (field.required) {
        const value = responses[currentSection.id]?.[field.name] ?? "";
        if (!value.trim()) {
          errors[field.name] = `${field.label} is required`;
        }
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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
    setValidationErrors({});
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
        setValidationErrors({});
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
          <h1 className="text-2xl font-bold text-foreground-strong capitalize">
            {auditType} Audit
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground-muted">
              Section {currentPage + 1} of {sections.length}
            </span>
            {/* Mode toggle placeholder */}
            <button
              type="button"
              onClick={() =>
                setMode((m) => (m === "form" ? "conversational" : "form"))
              }
              className="text-xs border border-border px-3 py-1.5 text-foreground-secondary hover:bg-surface-subtle"
              title="Conversational mode coming soon"
              disabled
            >
              {mode === "form" ? "Form" : "Chat"} mode
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
              {section.title}
            </button>
          );
        })}
      </div>

      {/* Current section form */}
      <div className="bg-surface-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground-strong mb-6">
          {currentSection.title}
        </h2>

        <div className="space-y-5">
          {currentSection.fields.map((field) => {
            const fieldError = validationErrors[field.name];
            const errorBorderClass = fieldError ? "border-red-400 dark:border-red-600" : "border-border";
            return (
            <div key={field.name}>
              <label
                htmlFor={`${currentSection.id}-${field.name}`}
                className="block text-sm font-medium text-foreground-secondary mb-1.5"
              >
                {field.label}
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
                  className={`w-full border ${errorBorderClass} px-3 py-2.5 text-sm text-foreground-strong bg-surface-card focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500`}
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
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
                  placeholder={field.placeholder}
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
                  placeholder={field.placeholder}
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
                  placeholder={field.placeholder}
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
          Back
        </button>

        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-xs text-foreground-tertiary">Saving...</span>
          )}

          {isLastPage ? (
            <button
              type="button"
              onClick={handleComplete}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-none font-medium text-sm disabled:opacity-50"
            >
              Complete Audit
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-none font-medium text-sm disabled:opacity-50"
            >
              Next: {sections[currentPage + 1]?.title}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
