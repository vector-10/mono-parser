"use client";
import { Bell, User, Key } from "lucide-react";

export default function DashboardHeader() {
  return (
    <header className="fixed top-0 left-64 right-0 h-18 bg-white border-b border-gray-200 z-10">
      <div className="flex items-center justify-between h-full px-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        </div>
        
        <div className="flex items-center gap-4">   
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0055ba] text-white hover:bg-[#004494] transition">
            <Key className="h-4 w-4" />
            Add API Key
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">QuickLoan Inc</p>
              <p className="text-xs text-gray-500">admin@quickloan.com</p>
            </div>
            <div className="w-10 h-10 bg-[#0055ba] rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}