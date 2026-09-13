"use client";

import { useRef, useState } from "react";
import { useLang } from "./LanguageProvider";
import ProcessSteps, { type Phase } from "./ProcessSteps";

type Props = {
  files: File[];
  setFiles: (f: File[]) => void;
  onExtract: () => void;
  extracting: boolean;
  phase: Phase;
};

export default function UploadPanel({ files, setFiles, onExtract, extracting, phase }: Props) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setHover(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles([...files, ...dropped]);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setFiles([...files, ...Array.from(e.target.files)]);
  }

  function removeFile(i: number) {
    setFiles(files.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2 className="display text-lg">{t("uploadTitle")}</h2>
        <p className="text-[12px] text-subink mt-0.5 leading-snug">{t("uploadHint")}</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setHover(true); }}
        onDragLeave={() => setHover(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          "card cursor-pointer transition-all duration-200",
          "px-3.5 py-3 flex items-center gap-3 text-left",
          hover ? "!border-ink !border-2 !bg-soft" : "",
        ].join(" ")}
      >
        <div className="w-8 h-8 rounded-md bg-soft border border-line flex items-center justify-center text-ink text-sm shrink-0">
          ↑
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-medium leading-tight truncate">{t("uploadDrop")}</div>
          <div className="text-[11px] text-subink leading-tight truncate">
            {t("uploadOr")} · {t("uploadFormats")}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/*"
          multiple
          className="hidden"
          onChange={onPick}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2 px-1">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center justify-between card pop-in"
              style={{ padding: "10px 14px" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileIcon name={f.name} />
                <div className="min-w-0">
                  <div className="text-sm truncate">{f.name}</div>
                  <div className="text-[11px] text-subink mono">
                    {(f.size / 1024).toFixed(0)} KB
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                aria-label="remove"
                className="w-7 h-7 rounded-full text-subink hover:text-ink hover:bg-soft transition-colors"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onExtract}
        disabled={!files.length || extracting}
        className="btn-primary w-full h-10 text-[13.5px]"
      >
        {extracting ? (
          <span className="inline-flex items-center gap-2">
            {t("extracting")}
            <span className="inline-flex">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <span>✦</span> {t("extractCta")}
          </span>
        )}
      </button>

      <ProcessSteps phase={phase} />
    </div>
  );
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toUpperCase() || "FILE";
  return (
    <div className="w-9 h-9 rounded-md bg-soft border border-line flex items-center justify-center text-[10px] font-semibold text-subink">
      {ext.slice(0, 3)}
    </div>
  );
}
