"use client";

import { useState } from "react";

const LINKS = [
  { href: "#dashboard", label: "Dashboard" },
  { href: "#how", label: "How it works" },
  { href: "#feed", label: "Live feed" },
  { href: "#bridge", label: "The bridge" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-panel-border bg-panel text-foreground"
      >
        <span className="relative block h-3 w-4" aria-hidden>
          <span
            className={`absolute left-0 top-0 h-[1.5px] w-4 bg-foreground transition-transform ${
              open ? "translate-y-[5px] rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-0 bottom-0 h-[1.5px] w-4 bg-foreground transition-transform ${
              open ? "-translate-y-[5px] -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {open && (
        <div
          id="mobile-nav-panel"
          className="absolute inset-x-0 top-full z-20 border-t border-panel-border bg-panel px-6 py-4"
        >
          <nav className="flex flex-col gap-4 text-sm text-muted">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
