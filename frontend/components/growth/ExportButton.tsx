"use client";

import { useState, useCallback } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

interface ExportButtonProps {
  hasExported: boolean;
  isStale?: boolean;
  className?: string;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function ExportButton({
  hasExported,
  isStale,
  className = "",
}: ExportButtonProps) {
  const [showConsent, setShowConsent] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadExport = useCallback(async (withConsent: boolean) => {
    setIsDownloading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        setError("Please log in to export your strategy.");
        setIsDownloading(false);
        return;
      }

      const res = await fetch(
        `${BASE_URL}/growth-strategy/export/markdown`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ consent: withConsent }),
        }
      );

      if (!res.ok) {
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const json = await res.json();
          if (json.error?.details?.[0]?.requires_consent) {
            setShowConsent(true);
            setIsDownloading(false);
            return;
          }
          throw new Error(json.error?.message ?? "Export failed");
        }
        throw new Error(`Export failed (${res.status})`);
      }

      // Download the zip blob
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "investoros-growth-strategy.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!hasExported) {
      // First-time export: show consent dialog
      setShowConsent(true);
    } else {
      // Subsequent exports: consent already given
      downloadExport(false);
    }
  }, [hasExported, downloadExport]);

  const handleConsentConfirm = useCallback(() => {
    setShowConsent(false);
    downloadExport(true);
  }, [downloadExport]);

  const handleConsentCancel = useCallback(() => {
    setShowConsent(false);
  }, []);

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isDownloading}
        className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          isStale
            ? "bg-amber-600 text-white hover:bg-amber-700"
            : "bg-gray-900 text-white hover:bg-gray-800"
        } disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {isDownloading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Generating...
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            {isStale ? "Download Fresh Export" : "Export Strategy"}
          </>
        )}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {showConsent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Export Growth Strategy
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your export will include your investor identity profile, growth
              strategy, and action plans as markdown files in a zip archive.
            </p>
            <div className="mt-3 rounded-md bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                <strong>Sensitive data notice:</strong> This export may include
                financial data such as income figures, capital targets, and
                funding channel details. Store the downloaded file securely and
                do not share it publicly.
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleConsentCancel}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConsentConfirm}
                className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                I Understand, Export
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
