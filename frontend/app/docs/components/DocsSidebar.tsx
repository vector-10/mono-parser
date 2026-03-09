"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen, Menu, X } from "lucide-react";

const navItems = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/authentication", label: "Authentication" },
  { href: "/docs/integration-flow", label: "Integration Flow" },
  {
    href: "/docs/api-reference",
    label: "API Reference",
    children: [
      { href: "/docs/api-reference#initiate", label: "Initiate Application" },
      { href: "/docs/api-reference#link-account", label: "Link Account" },
      { href: "/docs/api-reference#analyze", label: "Analyze Application" },
    ],
  },
  {
    href: "/docs/webhooks",
    label: "Webhooks",
    children: [
      { href: "/docs/webhooks#wh-account-linked", label: "account.linked" },
      { href: "/docs/webhooks#wh-enrichment-ready", label: "account.enrichment_ready" },
      { href: "/docs/webhooks#wh-decision", label: "application.decision" },
    ],
  },
  { href: "/docs/decision-object", label: "Decision Object" },
  { href: "/docs/score-bands", label: "Score Bands" },
  { href: "/docs/errors", label: "Error Handling" },
  { href: "/docs/notes-for-fintechs", label: "Notes for Fintechs" },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/docs") return pathname === "/docs";
    return pathname.startsWith(href.split("#")[0]);
  };

  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <div key={item.href}>
          <Link
            href={item.href.split("#")[0]}
            onClick={onNavigate}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition font-medium block ${
              isActive(item.href)
                ? "bg-[#0055ba]/10 text-[#0055ba]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {item.label}
          </Link>
          {item.children && (
            <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition block ${
                    isActive(child.href) && pathname === child.href.split("#")[0]
                      ? "text-[#0055ba] font-semibold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

// Mobile toggle bar + drawer — rendered outside the flex container
export function DocsMobileNav() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle bar */}
      <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" /> Contents
        </span>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="flex items-center gap-1.5 text-sm font-medium text-[#0055ba] hover:text-[#004494] transition"
        >
          {mobileNavOpen ? (
            <><X className="h-4 w-4" /> Close</>
          ) : (
            <><Menu className="h-4 w-4" /> Browse</>
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-gray-200 z-50 lg:hidden transform transition-transform duration-300 overflow-y-auto p-4 pt-20 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Table of Contents</span>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <NavContent onNavigate={() => setMobileNavOpen(false)} />
      </div>
    </>
  );
}

// Desktop sticky sidebar — rendered inside the flex container
export function DocsDesktopSidebar() {
  return (
    <aside className="hidden lg:block w-64 shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-200 p-6">
      <NavContent />
    </aside>
  );
}
