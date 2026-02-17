"use client";
import { Bell,  Key } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import AddApiKeyModal from "./AddApiKeyModal";

export default function DashboardHeader() {
  const user = useAuthStore((state) => state.user);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-10 pl-64">
        <div className="flex items-center justify-between h-full px-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsApiKeyModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0055ba] text-white hover:bg-[#004494] transition"
            >
              <Key className="h-4 w-4" />
             {user?.hasMonoApiKey ? "Update API Key" : "Add API Key"}
            </button>
            
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <Bell className="h-5 w-5 text-gray-600" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user ? `${user.name} of ${user.companyName}` : "User Name"}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email || "email@company.com"}
                </p>
              </div>
              <div className="w-10 h-10 bg-[#0055ba] rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <AddApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)} 
      />
    </>
  );
}