"use client";

import { useState, useCallback, useRef } from "react";
import UploadPanel from "./UploadPanel";
import FieldsEditor from "./FieldsEditor";
import CopilotChat from "./CopilotChat";
import { type Phase } from "./ProcessSteps";
import { useLang } from "./LanguageProvider";
import {
  EMPTY_FIELDS,
  computeFinancials,
  applySmartDefaults,
  type ContractFields,
} from "@/lib/schema";

export default function Workspace() {
  const { lang, setLang, t } = useLang();
  const [fields, setFields] = useState<ContractFields>(EMPTY_FIELDS);
  const [phase, setPhase] = useState<Phase>("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [justFilled, setJustFilled] = useState<Set<string>>(new Set());
  const [extractedOnce, setExtractedOnce] = useState(false);
  const [customTemplate, setCustomTemplate] = useState<File | null>(null);
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
    const fd = new FormData();
    fd.append("fields", JSON.stringify(fields));
    if (customTemplate) fd.append("template", customTemplate);
    const res = await fetch("/api/fill", { method: "POST", body: fd });
    if (!res.ok) {
      setPhase("idle");
      const data = await res.json().catch(() => null);
      alert(data?.error === "invalid_template" ? t("templateInvalid") : t("error"));
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
        templateName={customTemplate?.name ?? null}
        onUploadTemplate={setCustomTemplate}
        onResetTemplate={() => setCustomTemplate(null)}
      />
      <div className="flex-1 grid grid-cols-[420px_1fr_440px] gap-5 p-5 overflow-hidden">
        <aside className="overflow-y-auto pr-1">
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
  templateName,
  onUploadTemplate,
  onResetTemplate,
}: {
  lang: "fr" | "en";
  setLang: (l: "fr" | "en") => void;
  onDownload: () => void;
  ready: boolean;
  templateName: string | null;
  onUploadTemplate: (f: File) => void;
  onResetTemplate: () => void;
}) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
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

        {templateName && (
          <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-accent border border-blue-100 max-w-[180px]">
            <span className="truncate">
              {t("templateActivePrefix")} {templateName}
            </span>
            <button
              onClick={onResetTemplate}
              aria-label="reset template"
              className="shrink-0 opacity-70 hover:opacity-100"
              title={t("templateResetCta")}
            >
              ✕
            </button>
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUploadTemplate(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          title={t("uploadTemplateHint")}
          className="btn-ghost h-10 px-4 text-sm"
        >
          {t("uploadTemplateCta")}
        </button>

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
