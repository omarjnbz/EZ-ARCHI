"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "./LanguageProvider";

type SavedTemplate = { id: string; name: string; dataUrl: string; addedAt: number };

const LIST_KEY = "ez-archi-templates-v1";
const ACTIVE_KEY = "ez-archi-active-template-v1";

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const list = loadSaved();
    setSaved(list);
    const lastActive = localStorage.getItem(ACTIVE_KEY);
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
        <h2 className="display text-2xl">{t("templateTitle")}</h2>
        <p className="text-[13px] text-subink mt-1 leading-relaxed">{t("templateHint")}</p>
      </div>

      <div className="card divide-y divide-line/60 overflow-hidden">
        <TemplateRow
          active={activeId === "default"}
          label={t("templateDefaultLabel")}
          sublabel={t("templateDefaultSub")}
          onSelect={selectDefault}
        />
        {saved.map((tpl) => (
          <TemplateRow
            key={tpl.id}
            active={activeId === tpl.id}
            label={tpl.name}
            sublabel={new Date(tpl.addedAt).toLocaleDateString()}
            onSelect={() => selectSaved(tpl)}
            onRemove={() => removeSaved(tpl.id)}
          />
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] text-amber-800 leading-relaxed">
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
            className="w-full bg-white border border-line rounded-xl px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 transition-all"
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
            className="btn-ghost w-full h-11 text-[14px]"
          >
            {t("templateAddCta")}
          </button>
        </>
      )}
    </div>
  );
}

function TemplateRow({
  active,
  label,
  sublabel,
  onSelect,
  onRemove,
}: {
  active: boolean;
  label: string;
  sublabel: string;
  onSelect: () => void;
  onRemove?: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={[
        "flex items-center justify-between gap-3 px-4 py-3 cursor-pointer transition-colors",
        active ? "bg-[#F0F7FF]" : "hover:bg-soft",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={[
            "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
            active ? "border-accent" : "border-line",
          ].join(" ")}
        >
          {active && <span className="w-2 h-2 rounded-full bg-accent" />}
        </span>
        <div className="min-w-0">
          <div className="text-[14px] truncate">{label}</div>
          <div className="text-[11px] text-subink truncate">{sublabel}</div>
        </div>
      </div>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="remove"
          className="w-7 h-7 rounded-full text-subink hover:text-ink hover:bg-white transition-colors flex-shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  );
}
