"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RiDashboardLine, RiFileList3Line, RiShieldCheckLine, RiTeamLine, RiSettings3Line, RiLogoutBoxLine } from "react-icons/ri";
import { useAuthStore } from "@/lib/store/auth";
import { authApi } from "@/lib/api/auth";

const navItems = [
  { href: "/dashboard", icon: RiDashboardLine, label: "Overview", exact: true },
  { href: "/dashboard/applications", icon: RiFileList3Line, label: "Applications", exact: false },
  { href: "/dashboard/review", icon: RiShieldCheckLine, label: "Manual Review", exact: false },
  { href: "/dashboard/applicants", icon: RiTeamLine, label: "Applicants", exact: false },
  { href: "/dashboard/settings", icon: RiSettings3Line, label: "Settings", exact: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.actions.logout);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    logout();
    router.push("/login");
  };

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#010101] flex flex-col z-20">
      <div className="px-6 py-7 border-b border-white/5">
        <span className="text-white font-semibold text-base tracking-tight">Mono-Parser</span>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-[#0055ba]/15 text-[#4d8fde]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-5 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <RiLogoutBoxLine className="w-4 h-4 shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  );
}
