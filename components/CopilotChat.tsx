"use client";

import { useState, useRef, useEffect } from "react";
import { useLang } from "./LanguageProvider";
import type { ContractFields } from "@/lib/schema";

type Msg = { role: "user" | "assistant"; content: string };

type Props = {
  fields: ContractFields;
  applyPatch: (patch: Partial<ContractFields>) => void;
};

export default function CopilotChat({ fields, applyPatch }: Props) {
  const { lang, t } = useLang();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset intro line when language switches so it always shows in the right tongue
  useEffect(() => {
    if (messages.length === 0) return;
    if (messages[0]?.role === "assistant") {
      setMessages((m) => [{ role: "assistant", content: t("copilotIntro") }, ...m.slice(1)]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [messages, loading]);

  async function send(textOverride?: string) {
    const value = (textOverride ?? input).trim();
    if (!value || loading) return;
    const userMsg: Msg = { role: "user", content: value };
    const isFirst = messages.length === 0;
    const next = isFirst
      ? [{ role: "assistant" as const, content: t("copilotIntro") }, userMsg]
      : [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, fields, lang }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages([...next, { role: "assistant", content: `${t("error")}: ${data.error}` }]);
      } else {
        setMessages([...next, { role: "assistant", content: data.reply }]);
        if (data.patch && typeof data.patch === "object") applyPatch(data.patch);
      }
    } catch {
      setMessages([...next, { role: "assistant", content: t("networkError") }]);
    } finally {
      setLoading(false);
    }
  }

  const examples: ("copilotExample1" | "copilotExample2" | "copilotExample3" | "copilotExample4")[] = [
    "copilotExample1",
    "copilotExample2",
    "copilotExample3",
    "copilotExample4",
  ];

  return (
    <div className="flex flex-col h-full card !rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-line/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-ink flex items-center justify-center text-canvas text-xs font-semibold">
            AI
          </div>
          <div>
            <div className="display text-base leading-none">{t("copilotTitle")}</div>
            <div className="text-[11px] text-subink leading-none mt-1">{t("copilotSubtitle")}</div>
          </div>
        </div>
        {loading && (
          <span className="text-accent">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-5 fade-in">
            <div className="rounded-2xl border border-line/70 bg-soft p-4">
              <div className="text-[13px] font-semibold mb-1">{t("copilotHowTitle")}</div>
              <p className="text-[12.5px] text-subink leading-relaxed">{t("copilotHowBody")}</p>
            </div>

            <div className="rounded-2xl bg-surface border border-line/70 p-4">
              <p className="text-[13px] leading-relaxed text-ink">{t("copilotIntro")}</p>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-subink font-medium mb-2">
                {t("copilotExamplesTitle")}
              </div>
              <div className="flex flex-wrap gap-2">
                {examples.map((ex) => (
                  <button key={ex} onClick={() => send(t(ex))} className="chip">
                    {t(ex)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[88%] bg-accent text-accentFg px-3.5 py-2.5 text-[13.5px] leading-relaxed pop-in rounded-2xl rounded-tr-md"
                : "mr-auto max-w-[92%] bg-soft text-ink px-3.5 py-2.5 text-[13.5px] leading-relaxed pop-in rounded-2xl rounded-tl-md"
            }
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="mr-auto bg-soft px-3.5 py-2.5 rounded-2xl rounded-tl-md">
            <span className="text-accent">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-line/60 p-3 bg-canvas/60 backdrop-blur">
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
            placeholder={t("copilotPlaceholder")}
            rows={2}
            className="flex-1 bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-[13.5px] resize-none focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="btn-primary h-10 w-10 flex items-center justify-center"
            aria-label="send"
          >
            ↑
          </button>
        </div>
        <div className="text-[10.5px] text-subink mt-2 leading-snug">{t("copilotFooter")}</div>
      </div>
    </div>
  );
}
