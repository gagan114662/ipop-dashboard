"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "overseer";
  text: string;
}

const SUGGESTIONS = [
  "What's flagged right now?",
  "Draft a marketing email for ipop",
  "What can you actually do?",
  "Goals progress?",
];

export default function OverseerChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "overseer",
      text:
        "Ask me about this deployment's real data (what's flagged, capability status, goals) and I'll answer straight from it. Ask me to draft or explain something else and a real model answers — honestly, including when it can't do what you asked.",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [queueDepth, setQueueDepth] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Outgoing messages queue here instead of being dropped when one is already
  // in flight — sending 3 messages back to back used to silently lose 2 of
  // them (no queue, a mid-flight send() just returned early).
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function processQueue() {
    if (processingRef.current) return;
    processingRef.current = true;
    setPending(true);
    while (queueRef.current.length > 0) {
      const next = queueRef.current.shift()!;
      setQueueDepth(queueRef.current.length);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: next }),
        });
        const data = (await res.json()) as { reply?: string; error?: string };
        setMessages((m) => [...m, { role: "overseer", text: data.reply || data.error || "No response." }]);
      } catch {
        setMessages((m) => [...m, { role: "overseer", text: "Bridge unreachable — try again in a moment." }]);
      }
    }
    processingRef.current = false;
    setPending(false);
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    queueRef.current.push(trimmed);
    setQueueDepth(queueRef.current.length);
    void processQueue();
  }

  return (
    <div className="flex h-[420px] flex-col rounded-2xl border border-panel-border bg-panel">
      <div className="flex items-center gap-2 border-b border-panel-border px-5 py-3.5">
        <span className="h-2 w-2 rounded-full bg-accent animate-pulse-dot" aria-hidden />
        <span className="text-sm font-medium text-foreground">Overseer</span>
        <span className="ml-auto text-[11px] font-mono text-muted">real data + a real model</span>
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
        {pending && (
          <div className="text-xs text-muted">
            thinking{queueDepth > 0 ? ` — ${queueDepth} more queued` : "…"}
          </div>
        )}
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
          disabled={!input.trim()}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-[#04140b] disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
