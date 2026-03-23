"use client";
import { useState, useEffect, useRef } from "react";
import { RiInformationLine } from "react-icons/ri";

export function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex items-center group">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-gray-300 hover:text-[#0055ba] transition-colors focus:outline-none"
        tabIndex={-1}
      >
        <RiInformationLine className="w-3.5 h-3.5" />
      </button>

      <div
        className={`
          absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56
          bg-gray-900 text-white text-xs rounded-lg px-3 py-2 leading-relaxed shadow-lg
          pointer-events-none transition-opacity duration-150
          group-hover:opacity-100 group-hover:visible
          ${open ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
      >
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}
