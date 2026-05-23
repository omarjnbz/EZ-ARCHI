"use client";

import { useState, useRef, useEffect } from "react";
import type { ContractFields } from "@/lib/schema";

type Msg = { role: "user" | "assistant"; content: string };

type Props = {
  fields: ContractFields;
  applyPatch: (patch: Partial<ContractFields>) => void;
};

export default function CopilotChat({ fields, applyPatch }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Bonjour Omar. Dépose les pièces du dossier, je remplis le contrat. Tu peux aussi me demander de calculer les honoraires, vérifier la cohérence, reformuler une adresse…",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, fields }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages([...next, { role: "assistant", content: "Erreur : " + data.error }]);
      } else {
        setMessages([...next, { role: "assistant", content: data.reply }]);
        if (data.patch && typeof data.patch === "object") {
          applyPatch(data.patch);
        }
      }
    } catch (e: any) {
      setMessages([...next, { role: "assistant", content: "Erreur réseau." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-paper">
      <div className="px-5 py-4 border-b border-line">
        <div className="serif text-lg">Copilote</div>
        <div className="text-xs text-muted">Powered by GPT · Azure OpenAI</div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] bg-ink text-paper px-3 py-2 text-sm leading-relaxed fade-in"
                : "mr-auto max-w-[90%] bg-white border border-line px-3 py-2 text-sm leading-relaxed fade-in"
            }
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="mr-auto bg-white border border-line px-3 py-2 text-sm">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        )}
      </div>

      <div className="border-t border-line p-3">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Posez une question, demandez un calcul…"
            rows={2}
            className="flex-1 bg-white border border-line px-3 py-2 text-sm resize-none focus:outline-none focus:border-ink"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="h-9 px-4 bg-ink text-paper text-sm hover:bg-accent disabled:bg-line disabled:text-muted transition-colors"
          >
            ↑
          </button>
        </div>
        <div className="text-[10px] text-muted mt-2 leading-snug">
          Le copilote peut proposer des modifications de champs ; elles s'appliquent automatiquement.
        </div>
      </div>
    </div>
  );
}
