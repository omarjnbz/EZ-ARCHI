"use client";

import { useState, useCallback } from "react";
import UploadPanel from "./UploadPanel";
import FieldsEditor from "./FieldsEditor";
import CopilotChat from "./CopilotChat";
import {
  EMPTY_FIELDS,
  computeFinancials,
  type ContractFields,
} from "@/lib/schema";

export default function Workspace() {
  const [fields, setFields] = useState<ContractFields>(EMPTY_FIELDS);
  const [extracting, setExtracting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const updateFields = useCallback((patch: Partial<ContractFields>) => {
    setFields((prev) => {
      const next = { ...prev, ...patch };
      const computed = computeFinancials(next);
      return { ...next, ...computed };
    });
  }, []);

  async function extract() {
    if (!files.length) return;
    setExtracting(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (data.fields) updateFields(data.fields);
    } finally {
      setExtracting(false);
    }
  }

  async function downloadContract() {
    const res = await fetch("/api/fill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      alert("Erreur lors de la génération du contrat.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cd = res.headers.get("Content-Disposition") || "";
    const m = cd.match(/filename="([^"]+)"/);
    a.download = m ? m[1] : "contrat.docx";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-screen flex flex-col bg-paper text-ink overflow-hidden">
      <Header onDownload={downloadContract} />
      <div className="flex-1 grid grid-cols-[360px_1fr_400px] divide-x divide-line overflow-hidden">
        <aside className="overflow-y-auto">
          <UploadPanel
            files={files}
            setFiles={setFiles}
            onExtract={extract}
            extracting={extracting}
          />
        </aside>
        <main className="overflow-y-auto bg-white">
          <FieldsEditor fields={fields} onChange={updateFields} />
        </main>
        <aside className="overflow-hidden">
          <CopilotChat fields={fields} applyPatch={updateFields} />
        </aside>
      </div>
    </div>
  );
}

function Header({ onDownload }: { onDownload: () => void }) {
  return (
    <header className="flex items-center justify-between px-6 h-14 border-b border-line">
      <div className="flex items-baseline gap-3">
        <span className="serif text-2xl">EZ-ARCHI</span>
        <span className="text-xs text-muted tracking-wide uppercase">
          AI Copilot · Architecte
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted">LEGACY ARCHITECTS · Omar Dadouche</span>
        <button
          onClick={onDownload}
          className="px-4 h-9 text-sm bg-ink text-paper hover:bg-accent transition-colors"
        >
          Télécharger le contrat
        </button>
      </div>
    </header>
  );
}
