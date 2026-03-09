import Header from "../../components/Header";
import { DocsMobileNav, DocsDesktopSidebar } from "./components/DocsSidebar";
import Link from "next/link";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {/* Mobile nav outside flex — sticky bar + fixed drawer */}
      <DocsMobileNav />
      <div className="max-w-7xl mx-auto flex pt-16">
        {/* Desktop sidebar inside flex — sticky, no extra vertical space */}
        <DocsDesktopSidebar />
        <main className="flex-1 min-w-0 px-6 py-10 max-w-3xl">
          {children}
          <footer className="border-t border-gray-200 pt-10 mt-10 text-center">
            <p className="text-gray-500 text-sm mb-4">
              Need help? Reach out to{" "}
              <a
                href="mailto:support@firstsoftware-systems.com"
                className="text-[#0055ba] hover:underline"
              >
                support@firstsoftware-systems.com
              </a>
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#0055ba] font-semibold text-sm hover:underline"
            >
              ← Back to homepage
            </Link>
          </footer>
        </main>
      </div>
    </>
  );
}
