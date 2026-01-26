"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Computer, LogOut, ChevronDown, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useApplicants } from "@/lib/hooks/queries/use-applicants";
import { useApplicantsStore } from "@/lib/store/applicants";
import CreateApplicantModal from "./CreateApplicantModal";

export default function Sidebar() {
  const pathname = usePathname();
  const [operationsOpen, setOperationsOpen] = useState(true);
  const [applicantsOpen, setApplicantsOpen] = useState(true);
  
  const { data: applicants, isLoading } = useApplicants();
  const { isCreateModalOpen, actions } = useApplicantsStore();

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
                {/* Create Applicant */}
                <button
                  onClick={actions.openCreateModal}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                  Create Applicant
                </button>
                
                {/* Applicants - Nested Expandable */}
                <div>
                  <button
                    onClick={() => setApplicantsOpen(!applicantsOpen)}
                    className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4" />
                      Applicants
                      {isLoading && (
                        <span className="text-xs text-gray-400">(loading...)</span>
                      )}
                    </div>
                    <ChevronDown className={`h-3 w-3 transition-transform ${applicantsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {applicantsOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {applicants?.length === 0 && (
                        <p className="px-4 py-2 text-xs text-gray-400">No applicants yet</p>
                      )}
                      {applicants?.map((applicant) => (
                        <Link
                          key={applicant.id}
                          href={`/dashboard/operations/${applicant.id}`}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                            pathname === `/dashboard/operations/${applicant.id}`
                              ? "bg-[#0055ba]/10 text-[#0055ba] font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className="w-2 h-2 bg-[#59a927] rounded-full" />
                          <span className="truncate">{applicant.name}</span>
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

      <CreateApplicantModal 
        isOpen={isCreateModalOpen} 
        onClose={actions.closeCreateModal} 
      />
    </>
  );
}