"use client";

import { useState, useCallback, useRef } from "react";
import UploadPanel from "./UploadPanel";
import FieldsEditor from "./FieldsEditor";
import CopilotDock from "./CopilotDock";
import TemplateManager from "./TemplateManager";
import { type Phase } from "./ProcessSteps";
import { useLang } from "./LanguageProvider";
import { useTheme } from "./ThemeProvider";
import {
  EMPTY_FIELDS,
  computeFinancials,
  applySmartDefaults,
  type ContractFields,
} from "@/lib/schema";

type ActiveTemplate = { blob: Blob; name: string } | null;

export default function Workspace() {
  const { lang, setLang, t } = useLang();
  const [fields, setFields] = useState<ContractFields>(EMPTY_FIELDS);
  const [phase, setPhase] = useState<Phase>("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [justFilled, setJustFilled] = useState<Set<string>>(new Set());
  const [extractedOnce, setExtractedOnce] = useState(false);
  const [customTemplate, setCustomTemplate] = useState<ActiveTemplate>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);

  const updateFields = useCallback((patch: Partial<ContractFields>) => {
    setFields((prev) => {
      const next = { ...prev, ...patch };
      const computed = computeFinancials(next);
      return { ...next, ...computed };
    });
  }, []);

  function markFilled(keys: string[]) {
    setJustFilled(new Set(keys));
    setTimeout(() => setJustFilled(new Set()), 2200);
  }

  async function extract() {
    if (!files.length) return;
    setPhase("upload");
    await new Promise((r) => setTimeout(r, 250));
    setPhase("read");
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const readP = fetch("/api/extract", { method: "POST", body: fd });
      setTimeout(() => setPhase("extract"), 1000);
      const res = await readP;
      const data = await res.json();
      setPhase("compose");
      if (data.fields && typeof data.fields === "object") {
        const filtered: Partial<ContractFields> = {};
        const filledKeys: string[] = [];
        for (const [k, v] of Object.entries(data.fields)) {
          if (typeof v === "string" && v.length) {
            (filtered as any)[k] = v;
            filledKeys.push(k);
          }
        }
        setFields((prev) => {
          const next = { ...prev, ...filtered };
          const defaults = applySmartDefaults(next);
          for (const k of Object.keys(defaults)) filledKeys.push(k);
          const merged = { ...next, ...defaults };
          const computed = computeFinancials(merged);
          for (const k of Object.keys(computed)) filledKeys.push(k);
          return { ...merged, ...computed };
        });
        markFilled(filledKeys);
        // Stagger reveal: scroll editor to top so user sees first section
        editorScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
      setExtractedOnce(true);
      await new Promise((r) => setTimeout(r, 600));
      setPhase("ready");
    } catch (e) {
      console.error("extract failed", e);
      setPhase("idle");
    }
  }

  async function downloadContract() {
    setPhase("compose");
    setDownloadError(null);
    const fd = new FormData();
    fd.append("fields", JSON.stringify(fields));
    if (customTemplate) fd.append("template", customTemplate.blob, `${customTemplate.name}.docx`);
    const res = await fetch("/api/fill", { method: "POST", body: fd });
    if (!res.ok) {
      setPhase("idle");
      const data = await res.json().catch(() => null);
      const key =
        data?.error === "legacy_doc_format"
          ? "templateLegacyDoc"
          : data?.error === "invalid_template"
          ? "templateFillError"
          : "error";
      setDownloadError(t(key as any));
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cd = res.headers.get("Content-Disposition") || "";
    const m = cd.match(/filename="([^"]+)"/);
    a.download = m ? m[1] : "contract.docx";
    a.click();
    URL.revokeObjectURL(url);
    setPhase("ready");
  }

  return (
    <div className="h-screen flex flex-col bg-canvas text-ink overflow-hidden">
      <Header
        lang={lang}
        setLang={setLang}
        onDownload={downloadContract}
        ready={phase === "ready" || phase === "compose"}
      />
      {downloadError && (
        <div className="px-5 pt-3 -mb-1">
          <div className="flex items-start justify-between gap-3 rounded-lg border px-4 py-2.5 text-[12.5px] leading-relaxed fade-in border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-fg)]">
            <span>{downloadError}</span>
            <button
              onClick={() => setDownloadError(null)}
              aria-label="dismiss"
              className="shrink-0 opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 grid grid-cols-[272px_1fr] gap-4 p-4 overflow-hidden">
        <aside className="overflow-y-auto pr-1 space-y-6">
          <TemplateManager
            onActiveChange={(blob, name) => setCustomTemplate(blob && name ? { blob, name } : null)}
          />
          <UploadPanel
            files={files}
            setFiles={setFiles}
            onExtract={extract}
            extracting={phase !== "idle" && phase !== "ready"}
            phase={phase}
          />
        </aside>
        <main
          ref={editorScrollRef}
          className="overflow-y-auto card !rounded-xl relative"
        >
          <FieldsEditor
            fields={fields}
            onChange={updateFields}
            justFilled={justFilled}
            extractedOnce={extractedOnce}
          />
        </main>
      </div>
      <CopilotDock fields={fields} applyPatch={updateFields} />
    </div>
  );
}

function Header({
  lang,
  setLang,
  onDownload,
  ready,
}: {
  lang: "fr" | "en";
  setLang: (l: "fr" | "en") => void;
  onDownload: () => void;
  ready: boolean;
}) {
  const { t } = useLang();
  return (
    <header className="flex items-center justify-between px-6 h-16 border-b border-line bg-canvas/85 backdrop-blur-xl sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-accentFg display text-[13px]">
          EA
        </div>
        <div className="flex flex-col">
          <span className="display text-[15px] leading-none">EZ-ARCHI</span>
          <span className="text-[11px] text-subink leading-none mt-1 tracking-wide uppercase">
            {t("tagline")}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <LangToggle lang={lang} setLang={setLang} />
        <ThemeToggle />
        <span className="text-xs text-subink hidden md:inline">{t("legacy")}</span>
        <button
          onClick={onDownload}
          disabled={!ready}
          className="btn-primary h-9 px-4 text-[13px]"
        >
          {t("downloadCta")}
        </button>
      </div>
    </header>
  );
}

function LangToggle({
  lang,
  setLang,
}: {
  lang: "fr" | "en";
  setLang: (l: "fr" | "en") => void;
}) {
  return (
    <div className="relative inline-flex bg-soft rounded-md p-0.5 border border-line">
      {(["fr", "en"] as const).map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            onClick={() => setLang(code)}
            className={[
              "relative z-10 px-2.5 h-7 text-[11px] font-medium rounded transition-colors duration-150",
              active ? "bg-accent text-accentFg" : "text-subink hover:text-ink",
            ].join(" ")}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="toggle theme"
      title={isDark ? "Light mode" : "Dark mode"}
      className="w-8 h-8 rounded-md border border-line flex items-center justify-center text-subink hover:text-ink hover:bg-soft transition-colors"
    >
      {isDark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
