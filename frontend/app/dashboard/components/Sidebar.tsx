"use client";
import Link from "next/link";
import { Home, Computer, LogOut } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <h1 className="text-xl font-bold text-[#0055ba]">Mono-Parser</h1>
      </div>
      
      <nav className="px-4 space-y-2">
        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#0055ba]/10 text-[#0055ba] font-medium">
          <Home className="h-5 w-5" />
          Dashboard
        </Link>
        
        <Link href="/dashboard/operations" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
          <Computer className="h-5 w-5" />
          Operations
        </Link>
        
        
      </nav>
      
      <div className="absolute bottom-6 left-4 right-4">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50">
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}