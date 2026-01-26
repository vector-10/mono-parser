"use client";
import Link from "next/link";
import {
  Home,
  Computer,
  LogOut,
  ChevronDown,
  Plus,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const [operationsOpen, setOperationsOpen] = useState(true);
  const [applicationsOpen, setApplicationsOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const applications = [
    { id: "1", name: "Samuel Okon" },
    { id: "2", name: "Jane Doe" },
    { id: "3", name: "Chidi Eze" },
  ];

 return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          <h1 className="text-xl font-bold text-[#0055ba]">Mono-Parser</h1>
        </div>
        
        <nav className="px-4 space-y-2">
          <Link 
            href="/dashboard" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              pathname === "/dashboard" 
                ? "bg-[#0055ba]/10 text-[#0055ba] font-medium" 
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Home className="h-5 w-5" />
            Dashboard
          </Link>
          
          {/* Operations - Expandable */}
          <div>
            <button
              onClick={() => setOperationsOpen(!operationsOpen)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Computer className="h-5 w-5" />
                Operations
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${operationsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {operationsOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {/* Create Application */}
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                  Create Application
                </button>
                
                {/* Applications - Nested Expandable */}
                <div>
                  <button
                    onClick={() => setApplicationsOpen(!applicationsOpen)}
                    className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4" />
                      Applications
                    </div>
                    <ChevronDown className={`h-3 w-3 transition-transform ${applicationsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {applicationsOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {applications.map((app) => (
                        <Link
                          key={app.id}
                          href={`/dashboard/operations/${app.id}`}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                            pathname === `/dashboard/operations/${app.id}`
                              ? "bg-[#0055ba]/10 text-[#0055ba] font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className="w-2 h-2 bg-[#59a927] rounded-full" />
                          {app.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
        
        <div className="absolute bottom-6 left-4 right-4">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50">
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Modal - will move to separate component */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Create Application</h2>
            <p className="text-gray-500">Modal form goes here...</p>
            <button onClick={() => setShowModal(false)} className="mt-4 px-4 py-2 bg-[#0055ba] text-white rounded-lg">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}