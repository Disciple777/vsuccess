"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

interface HelpTipProps {
  /** The explanation text shown inside the popover */
  text: string;
  /** Which side to anchor the popover to (relative to the button) */
  align?: "left" | "right" | "center";
}

/**
 * Small "?" button that reveals an explanation popover on hover/click.
 * Closes on outside click or Escape key.
 */
export default function HelpTip({ text, align = "left" }: HelpTipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const alignClass =
    align === "right" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";

  return (
    <div
      className="relative inline-flex items-center"
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Help"
        title="What's this?"
        className="flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.08]
                   text-white/30 hover:text-white/70 hover:border-white/[0.15] transition-all duration-200 cursor-pointer"
      >
        <HelpCircle className="w-3 h-3" />
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] p-3.5 rounded-xl bg-[#0c0c12]/95 backdrop-blur-xl
                      border border-white/[0.08] shadow-2xl animate-fade-in ${alignClass}`}
        >
          <p className="text-[11px] leading-relaxed text-white/60 whitespace-pre-line">{text}</p>
        </div>
      )}
    </div>
  );
}
