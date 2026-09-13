"use client";

import { useState, useCallback, useRef } from "react";
import UploadPanel from "./UploadPanel";
import FieldsEditor from "./FieldsEditor";
import CopilotChat from "./CopilotChat";
import TemplateManager from "./TemplateManager";
import { type Phase } from "./ProcessSteps";
import { useLang } from "./LanguageProvider";
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
    <div className="h-screen flex flex-col bg-canvas text-ink overflow-hidden hero-bg">
      <Header
        lang={lang}
        setLang={setLang}
        onDownload={downloadContract}
        ready={phase === "ready" || phase === "compose"}
      />
      {downloadError && (
        <div className="px-5 pt-3 -mb-1">
          <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12.5px] text-amber-800 leading-relaxed fade-in">
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
      <div className="flex-1 grid grid-cols-[420px_1fr_440px] gap-5 p-5 overflow-hidden">
        <aside className="overflow-y-auto pr-1 space-y-8">
          <UploadPanel
            files={files}
            setFiles={setFiles}
            onExtract={extract}
            extracting={phase !== "idle" && phase !== "ready"}
            phase={phase}
          />
          <TemplateManager
            onActiveChange={(blob, name) => setCustomTemplate(blob && name ? { blob, name } : null)}
          />
        </aside>
        <main
          ref={editorScrollRef}
          className="overflow-y-auto card !rounded-[28px] relative"
        >
          <FieldsEditor
            fields={fields}
            onChange={updateFields}
            justFilled={justFilled}
            extractedOnce={extractedOnce}
          />
        </main>
        <aside className="overflow-hidden">
          <CopilotChat fields={fields} applyPatch={updateFields} />
        </aside>
      </div>
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
    <header className="flex items-center justify-between px-6 h-16 border-b border-line/60 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-accent to-[#4ba1ff] flex items-center justify-center text-white display text-lg shadow-soft">
          EA
        </div>
        <div className="flex flex-col">
          <span className="display text-[17px] leading-none">EZ-ARCHI</span>
          <span className="text-[11px] text-subink leading-none mt-1 tracking-wide uppercase">
            {t("tagline")}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <LangToggle lang={lang} setLang={setLang} />
        <span className="text-xs text-subink hidden md:inline">{t("legacy")}</span>
        <button
          onClick={onDownload}
          disabled={!ready}
          className="btn-primary h-10 px-5 text-sm"
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
    <div className="relative inline-flex bg-soft rounded-full p-0.5 border border-line/70">
      {(["fr", "en"] as const).map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            onClick={() => setLang(code)}
            className={[
              "relative z-10 px-3 h-7 text-xs font-medium rounded-full transition-all duration-300",
              active ? "text-white" : "text-subink hover:text-ink",
            ].join(" ")}
            style={{
              background: active ? "linear-gradient(180deg,#0077ED,#0066CF)" : "transparent",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,113,227,.28)" : undefined,
            }}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
