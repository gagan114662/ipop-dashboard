"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "overseer";
  text: string;
}

const SUGGESTIONS = ["What's flagged right now?", "Any revenue connected?", "Show capability status", "Goals progress?"];

export default function OverseerChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "overseer",
      text:
        "I'm grounded in this deployment's real bridge data (events, status, revenue) — not a general model. Ask what's flagged, what capabilities are online, or goal progress.",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      setMessages((m) => [...m, { role: "overseer", text: data.reply || data.error || "No response." }]);
    } catch {
      setMessages((m) => [...m, { role: "overseer", text: "Bridge unreachable — try again in a moment." }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-[420px] flex-col rounded-2xl border border-panel-border bg-panel">
      <div className="flex items-center gap-2 border-b border-panel-border px-5 py-3.5">
        <span className="h-2 w-2 rounded-full bg-accent animate-pulse-dot" aria-hidden />
        <span className="text-sm font-medium text-foreground">Overseer</span>
        <span className="ml-auto text-[11px] font-mono text-muted">grounded, not an LLM</span>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-accent text-[#04140b]"
                  : "border border-panel-border bg-background text-foreground"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {pending && <div className="text-xs text-muted">thinking…</div>}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-panel-border px-5 py-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-panel-border px-3 py-1 text-xs text-muted hover:border-accent-dim hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2 border-t border-panel-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the overseer…"
          className="flex-1 rounded-full border border-panel-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-accent-dim"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-[#04140b] disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
