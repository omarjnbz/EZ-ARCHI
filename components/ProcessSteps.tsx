"use client";

import { useEffect, useState } from "react";
import { useLang } from "./LanguageProvider";

export type Phase = "idle" | "upload" | "read" | "extract" | "compose" | "ready";

const ORDER: Exclude<Phase, "idle">[] = ["upload", "read", "extract", "compose", "ready"];

const ICONS: Record<Exclude<Phase, "idle">, string> = {
  upload: "↑",
  read: "◌",
  extract: "✦",
  compose: "⌘",
  ready: "✓",
};

const KEY_LABEL: Record<Exclude<Phase, "idle">, "stepUpload" | "stepRead" | "stepExtract" | "stepCompose" | "stepReady"> = {
  upload: "stepUpload",
  read: "stepRead",
  extract: "stepExtract",
  compose: "stepCompose",
  ready: "stepReady",
};

const KEY_DESC: Record<Exclude<Phase, "idle">, "stepUploadDesc" | "stepReadDesc" | "stepExtractDesc" | "stepComposeDesc" | "stepReadyDesc"> = {
  upload: "stepUploadDesc",
  read: "stepReadDesc",
  extract: "stepExtractDesc",
  compose: "stepComposeDesc",
  ready: "stepReadyDesc",
};

export default function ProcessSteps({ phase }: { phase: Phase }) {
  const { t } = useLang();
  const activeIdx = phase === "idle" ? -1 : ORDER.indexOf(phase);

  // Auto-cycle through intermediate phases for a nice animation while extracting
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (phase !== "read" && phase !== "extract") return;
    const t = setInterval(() => setPulse((p) => p + 1), 700);
    return () => clearInterval(t);
  }, [phase]);

  if (phase === "idle") return null;

  return (
    <div className="card p-4 fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-[0.12em] text-subink font-medium">
          {t("extracting")}
        </div>
        <div className="text-[11px] text-subink mono">{activeIdx + 1} / {ORDER.length}</div>
      </div>

      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-0 right-0 top-[18px] h-[2px] bg-line rounded-full" />
        <div
          className="absolute left-0 top-[18px] h-[2px] bg-accent rounded-full transition-all duration-700 ease-spring"
          style={{ width: `${((activeIdx + 1) / ORDER.length) * 100}%` }}
        />

        <div className="grid grid-cols-5 gap-1 relative">
          {ORDER.map((step, i) => {
            const done = i < activeIdx;
            const active = i === activeIdx;
            return (
              <div key={step} className="flex flex-col items-center text-center">
                <div
                  className={[
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium border-2 bg-surface transition-all duration-500",
                    done && "border-accent text-accent",
                    active && "border-accent text-accent ring-pulse",
                    !done && !active && "border-line text-subink",
                  ].filter(Boolean).join(" ")}
                >
                  <span className={active ? "float-y" : ""}>
                    {done ? "✓" : ICONS[step]}
                  </span>
                </div>
                <div
                  className={[
                    "mt-2 text-[11px] font-medium leading-tight",
                    active ? "text-ink" : "text-subink",
                  ].join(" ")}
                >
                  {t(KEY_LABEL[step])}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activeIdx >= 0 && (
        <div key={pulse} className="mt-4 text-xs text-subink fade-in">
          {t(KEY_DESC[ORDER[activeIdx]])}
        </div>
      )}

      {(phase === "read" || phase === "extract") && (
        <div className="mt-3 h-1 rounded-full overflow-hidden bg-soft">
          <div className="h-full shimmer rounded-full" style={{ width: "100%" }} />
        </div>
      )}
    </div>
  );
}
