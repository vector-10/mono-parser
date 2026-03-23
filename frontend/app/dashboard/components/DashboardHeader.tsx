"use client";
import { usePathname } from "next/navigation";
import { RiBellLine } from "react-icons/ri";
import { useAuthStore } from "@/lib/store/auth";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/applications": "Applications",
  "/dashboard/review": "Manual Review",
  "/dashboard/applicants": "Applicants",
  "/dashboard/settings": "Settings",
};

function getTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  for (const [key, value] of Object.entries(pageTitles)) {
    if (pathname.startsWith(key) && key !== "/dashboard") return value;
  }
  return "Dashboard";
}

export default function DashboardHeader() {
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-white border-b border-gray-100 z-10">
      <div className="flex items-center justify-between h-full px-6">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-gray-50 transition-colors relative">
            <RiBellLine className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {user?.name ?? "—"}
              </p>
              <p className="text-xs text-gray-500 leading-tight">
                {user?.companyName ?? ""}
              </p>
            </div>
            <div className="w-8 h-8 bg-[#0055ba] rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-semibold">
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
