"use client";
import { useState } from "react";
import { RiFileCopyLine, RiCheckLine } from "react-icons/ri";

export function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-800 my-4">
      <div className="flex items-center justify-between bg-[#0d1117] px-4 py-2 border-b border-gray-800">
        <span className="text-xs text-gray-500 font-mono uppercase tracking-widest">
          {lang}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition"
        >
          {copied ? (
            <RiCheckLine className="h-3.5 w-3.5 text-[#59a927]" />
          ) : (
            <RiFileCopyLine className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="bg-[#0d1117] text-gray-300 text-xs sm:text-sm font-mono p-4 overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
}
