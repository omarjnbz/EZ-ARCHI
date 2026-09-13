"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "./LanguageProvider";

type SavedTemplate = { id: string; name: string; dataUrl: string; addedAt: number };

const LIST_KEY = "ez-archi-templates-v1";
const ACTIVE_KEY = "ez-archi-active-template-v1";
const NAJIB_ID = "najib";
const NAJIB_TEMPLATE_URL = "/templates/najib-dadouche.docx";
const NAJIB_TEMPLATE_NAME = "Najib Dadouche";
const OMAR_PREVIEW = "/previews/omar-default.png";
const NAJIB_PREVIEW = "/previews/najib-dadouche.png";

function loadSaved(): SavedTemplate[] {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function persistSaved(list: SavedTemplate[]) {
  try {
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
  } catch {
    // storage full/unavailable — the session still works, just won't persist
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime =
    meta.match(/data:(.*);base64/)?.[1] ||
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function sniffFormat(file: File): Promise<"docx" | "legacy-doc" | "unknown"> {
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04) return "docx";
  if (
    head[0] === 0xd0 &&
    head[1] === 0xcf &&
    head[2] === 0x11 &&
    head[3] === 0xe0 &&
    head[4] === 0xa1 &&
    head[5] === 0xb1 &&
    head[6] === 0x1a &&
    head[7] === 0xe1
  ) {
    return "legacy-doc";
  }
  return "unknown";
}

type Props = {
  onActiveChange: (blob: Blob | null, name: string | null) => void;
};

export default function TemplateManager({ onActiveChange }: Props) {
  const { t } = useLang();
  const [saved, setSaved] = useState<SavedTemplate[]>([]);
  const [activeId, setActiveId] = useState<string>("default");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ src: string; top: number; left: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function showPreview(e: React.MouseEvent, src: string) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPreview({ src, top: rect.top, left: rect.right + 10 });
  }
  function hidePreview() {
    setPreview(null);
  }

  useEffect(() => {
    const list = loadSaved();
    setSaved(list);
    const lastActive = localStorage.getItem(ACTIVE_KEY);
    if (lastActive === NAJIB_ID) {
      selectNajib();
      return;
    }
    const match = lastActive ? list.find((tpl) => tpl.id === lastActive) : undefined;
    if (match) {
      setActiveId(match.id);
      onActiveChange(dataUrlToBlob(match.dataUrl), match.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectDefault() {
    setActiveId("default");
    setError(null);
    try {
      localStorage.setItem(ACTIVE_KEY, "default");
    } catch {}
    onActiveChange(null, null);
  }

  async function selectNajib() {
    setActiveId(NAJIB_ID);
    setError(null);
    try {
      localStorage.setItem(ACTIVE_KEY, NAJIB_ID);
    } catch {}
    try {
      const res = await fetch(NAJIB_TEMPLATE_URL);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      onActiveChange(blob, NAJIB_TEMPLATE_NAME);
    } catch {
      setError(t("templateFillError"));
    }
  }

  function selectSaved(tpl: SavedTemplate) {
    setActiveId(tpl.id);
    setError(null);
    try {
      localStorage.setItem(ACTIVE_KEY, tpl.id);
    } catch {}
    onActiveChange(dataUrlToBlob(tpl.dataUrl), tpl.name);
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    const format = await sniffFormat(file);
    if (format === "legacy-doc") {
      setError(t("templateLegacyDoc"));
      return;
    }
    if (format === "unknown") {
      setError(t("templateInvalid"));
      return;
    }
    setPendingFile(file);
    setPendingName(file.name.replace(/\.docx?$/i, ""));
  }

  async function confirmAdd() {
    if (!pendingFile) return;
    const dataUrl = await fileToDataUrl(pendingFile);
    const entry: SavedTemplate = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: pendingName.trim() || pendingFile.name,
      dataUrl,
      addedAt: Date.now(),
    };
    const next = [...saved, entry];
    setSaved(next);
    persistSaved(next);
    setPendingFile(null);
    setPendingName("");
    selectSaved(entry);
  }

  function cancelAdd() {
    setPendingFile(null);
    setPendingName("");
  }

  function removeSaved(id: string) {
    const next = saved.filter((tpl) => tpl.id !== id);
    setSaved(next);
    persistSaved(next);
    if (activeId === id) selectDefault();
  }

  return (
    <div className="space-y-3">
      <div className="px-1">
        <h2 className="display text-lg">{t("templateTitle")}</h2>
        <p className="text-[12px] text-subink mt-0.5 leading-snug">{t("templateHint")}</p>
      </div>

      <div className="card divide-y divide-line/60 overflow-hidden">
        <ProfileRow
          active={activeId === "default"}
          initials="OD"
          label={t("templateDefaultLabel")}
          sublabel={t("templateDefaultSub")}
          onSelect={selectDefault}
          onPreviewIn={(e) => showPreview(e, OMAR_PREVIEW)}
          onPreviewOut={hidePreview}
        />
        <ProfileRow
          active={activeId === NAJIB_ID}
          initials="ND"
          label={NAJIB_TEMPLATE_NAME}
          sublabel={t("templateNajibSub")}
          onSelect={selectNajib}
          onPreviewIn={(e) => showPreview(e, NAJIB_PREVIEW)}
          onPreviewOut={hidePreview}
        />
      </div>

      {saved.length > 0 && (
        <div className="card divide-y divide-line/60 overflow-hidden">
          {saved.map((tpl) => (
            <ProfileRow
              key={tpl.id}
              active={activeId === tpl.id}
              initials={tpl.name.slice(0, 2).toUpperCase()}
              label={tpl.name}
              sublabel={new Date(tpl.addedAt).toLocaleDateString()}
              onSelect={() => selectSaved(tpl)}
              onRemove={() => removeSaved(tpl.id)}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] px-3.5 py-2.5 text-[12.5px] text-[var(--warning-fg)] leading-relaxed">
          {error}
        </div>
      )}

      {pendingFile ? (
        <div className="card p-4 space-y-3 pop-in">
          <div className="text-[11px] uppercase tracking-[0.1em] text-subink font-medium">
            {t("templateNamePrompt")}
          </div>
          <input
            autoFocus
            value={pendingName}
            onChange={(e) => setPendingName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmAdd()}
            className="w-full bg-canvas border border-line rounded-lg px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={cancelAdd} className="btn-ghost h-9 px-4 text-[13px]">
              {t("cancel")}
            </button>
            <button onClick={confirmAdd} className="btn-primary h-9 px-4 text-[13px]">
              {t("save")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
            className="hidden"
            onChange={onPick}
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full text-left px-1 text-[12px] text-subink hover:text-ink transition-colors"
          >
            {t("templateAddCta")}
          </button>
        </>
      )}

      {preview && (
        <div
          className="fixed z-40 w-56 rounded-lg border border-line bg-surface shadow-lift overflow-hidden pop-in pointer-events-none"
          style={{ top: preview.top, left: preview.left }}
        >
          <img src={preview.src} alt="" className="w-full h-auto block" />
          <div className="px-2.5 py-1.5 text-[10px] text-subink border-t border-line">
            {t("templatePreviewHint")}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileRow({
  active,
  initials,
  label,
  sublabel,
  onSelect,
  onRemove,
  onPreviewIn,
  onPreviewOut,
}: {
  active: boolean;
  initials: string;
  label: string;
  sublabel: string;
  onSelect: () => void;
  onRemove?: () => void;
  onPreviewIn?: (e: React.MouseEvent) => void;
  onPreviewOut?: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      onMouseEnter={onPreviewIn}
      onMouseLeave={onPreviewOut}
      className={[
        "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
        active ? "bg-soft" : "hover:bg-soft/60",
      ].join(" ")}
    >
      <div
        className={[
          "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition-colors",
          active ? "bg-accent text-accentFg" : "bg-soft border border-line text-subink",
        ].join(" ")}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-tight truncate">{label}</div>
        <div className="text-[11px] text-subink leading-tight truncate">{sublabel}</div>
      </div>
      {active && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent shrink-0">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="remove"
          className="w-6 h-6 rounded-full text-subink hover:text-ink hover:bg-canvas transition-colors flex-shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  );
}
