"use client";

import { useRef, useState } from "react";
import CopilotChat from "./CopilotChat";
import { useLang } from "./LanguageProvider";
import type { ContractFields } from "@/lib/schema";

type Props = {
  fields: ContractFields;
  applyPatch: (patch: Partial<ContractFields>) => void;
};

/**
 * Docked to the right edge, collapsed to a small tab by default so the
 * contract form gets the width. Hovering the tab (or the panel itself, once
 * open) reveals it; moving away closes it again after a short grace delay.
 */
export default function CopilotDock({ fields, applyPatch }: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function enter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function leave() {
    closeTimer.current = setTimeout(() => setOpen(false), 250);
  }
  function closeNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(false);
  }

  return (
    <>
      {!open && (
        <button
          onMouseEnter={enter}
          onClick={enter}
          aria-label={t("copilotOpen")}
          className="fixed top-1/2 -translate-y-1/2 right-0 z-30 w-10 h-32 rounded-l-xl border border-r-0 border-line bg-surface shadow-lift flex flex-col items-center justify-center gap-2.5 hover:bg-soft transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ink shrink-0">
            <path d="M12 3a8 8 0 0 1 8 8c0 4-3 7-8 9-5-2-8-5-8-9a8 8 0 0 1 8-8Z" strokeLinejoin="round" />
            <circle cx="9" cy="11" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="11" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="15" cy="11" r="0.8" fill="currentColor" stroke="none" />
          </svg>
          <span
            className="text-[10px] tracking-[0.15em] text-subink font-medium"
            style={{ writingMode: "vertical-rl" }}
          >
            {t("copilotTitle").toUpperCase()}
          </span>
        </button>
      )}

      <div
        onMouseEnter={enter}
        onMouseLeave={leave}
        className={[
          "fixed top-16 right-0 bottom-0 w-[400px] z-20 p-3",
          "transition-transform duration-300 ease-spring",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="relative h-full">
          <button
            onClick={closeNow}
            aria-label={t("copilotClose")}
            className="absolute -left-3 top-5 z-10 w-6 h-6 rounded-full border border-line bg-surface shadow-soft flex items-center justify-center text-subink hover:text-ink transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <CopilotChat fields={fields} applyPatch={applyPatch} />
        </div>
      </div>
    </>
  );
}
