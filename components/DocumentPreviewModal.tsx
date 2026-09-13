"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "./LanguageProvider";

type ActiveTemplate = { blob: Blob; name: string } | null;

type Props = {
  fields: Record<string, string>;
  template: ActiveTemplate;
  templateLabel: string;
  onClose: () => void;
  onConfirmDownload: () => void;
  downloading: boolean;
};

export default function DocumentPreviewModal({
  fields,
  template,
  templateLabel,
  onClose,
  onConfirmDownload,
  downloading,
}: Props) {
  const { t } = useLang();
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setError(null);

    const fd = new FormData();
    fd.append("fields", JSON.stringify(fields));
    if (template) fd.append("template", template.blob, `${template.name}.docx`);

    fetch("/api/preview", { method: "POST", body: fd })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !data?.html) {
          const key =
            data?.error === "legacy_doc_format"
              ? "templateLegacyDoc"
              : data?.error === "invalid_template"
              ? "templateFillError"
              : "previewError";
          setError(t(key as any));
          return;
        }
        setHtml(data.html);
      })
      .catch(() => {
        if (!cancelled) setError(t("networkError"));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[760px] h-full max-h-[88vh] card !rounded-2xl overflow-hidden flex flex-col pop-in shadow-lift">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div className="min-w-0">
            <h2 className="display text-lg leading-tight">{t("previewTitle")}</h2>
            <p className="text-[12px] text-subink mt-0.5 truncate">{templateLabel}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("previewClose")}
            className="w-8 h-8 rounded-md border border-line flex items-center justify-center text-subink hover:text-ink hover:bg-soft transition-colors shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-soft px-4 sm:px-8 py-6">
          {error && (
            <div className="max-w-[640px] mx-auto rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] px-4 py-3 text-[13px] text-[var(--warning-fg)] leading-relaxed">
              {error}
            </div>
          )}

          {!error && !html && (
            <div className="max-w-[640px] mx-auto bg-white rounded-sm shadow-lift px-10 py-12 space-y-3">
              <div className="h-4 w-2/3 rounded shimmer" />
              <div className="h-3 w-1/2 rounded shimmer" />
              <div className="h-3 w-full rounded shimmer mt-6" />
              <div className="h-3 w-full rounded shimmer" />
              <div className="h-3 w-4/5 rounded shimmer" />
              <div className="h-3 w-full rounded shimmer mt-6" />
              <div className="h-3 w-3/5 rounded shimmer" />
            </div>
          )}

          {!error && html && (
            <div
              ref={paperRef}
              className="docx-preview max-w-[640px] mx-auto bg-white text-black rounded-sm shadow-lift px-10 py-12 pop-in"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-line shrink-0 bg-canvas">
          <p className="text-[11px] text-subink hidden sm:block">{t("previewHint")}</p>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={onClose} className="btn-ghost h-10 px-4 text-[13px]">
              {t("previewEdit")}
            </button>
            <button
              onClick={onConfirmDownload}
              disabled={!html || downloading}
              className="btn-primary h-10 px-5 text-[13px]"
            >
              {downloading ? t("previewDownloading") : t("previewDownload")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
