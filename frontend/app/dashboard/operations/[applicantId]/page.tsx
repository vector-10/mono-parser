// "use client";
// import { Plus, Loader2, AlertCircle } from "lucide-react";
// import { use } from "react";
// import { useApplicant } from "@/lib/hooks/queries/use-applicant";

// export default function ApplicantProfilePage({
//   params,
// }: {
//   params: Promise<{ applicantId: string }>;
// }) {
//   const { applicantId } = use(params);
//   const { data: applicant, isLoading, error } = useApplicant(applicantId);

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
//         <Loader2 className="h-8 w-8 animate-spin text-[#0055ba]" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] text-center">
//         <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
//         <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to load applicant</h3>
//         <p className="text-gray-500">{error.message}</p>
//       </div>
//     );
//   }

//   if (!applicant) {
//     return null;
//   }

//   return (
//     <div className="max-w-5xl mx-auto space-y-6">
//       {/* Applicant Info Card */}
//       <div className="bg-white rounded-lg border border-gray-200 p-6">
//         <div className="flex items-start justify-between mb-6">
//           <div>
//             <h2 className="text-2xl font-bold text-gray-900">
//               {applicant.firstName} {applicant.lastName}
//             </h2>
//             <p className="text-gray-500">{applicant.email}</p>
//             {applicant.phone && <p className="text-gray-500">{applicant.phone}</p>}
//             {applicant.bvn && <p className="text-xs text-gray-400 font-mono mt-1">BVN: {applicant.bvn}</p>}
//           </div>
//           <button className="flex items-center gap-2 px-4 py-2 bg-[#0055ba] text-white rounded-lg hover:bg-[#004494]">
//             <Plus className="h-4 w-4" />
//             Create Application
//           </button>
//         </div>

//         <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
//           <div>
//             <p className="text-sm text-gray-600 mb-1">Applicant ID</p>
//             <p className="font-mono text-sm text-gray-900">{applicant.id}</p>
//           </div>
//           <div>
//             <p className="text-sm text-gray-600 mb-1">Created</p>
//             <p className="text-sm text-gray-900">{new Date(applicant.createdAt).toLocaleDateString()}</p>
//           </div>
//         </div>
//       </div>

//       {/* Bank Accounts Section */}
//       <div className="bg-white rounded-lg border border-gray-200 p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-semibold">Bank Accounts</h3>
//           <button className="text-sm text-[#0055ba] hover:underline">
//             + Link Bank Account
//           </button>
//         </div>
//         <p className="text-gray-500 text-sm">No bank accounts linked yet. Use Mono Connect to link accounts.</p>
//       </div>

//       {/* Applications History */}
//       <div className="bg-white rounded-lg border border-gray-200 p-6">
//         <h3 className="text-lg font-semibold mb-4">Loan Applications</h3>
//         <p className="text-gray-500 text-sm">No applications yet. Click "Create Application" to get started.</p>
//       </div>
//     </div>
//   );
// }



"use client";
import { Loader2, AlertCircle } from "lucide-react";
import { use, useState } from "react";
import { useApplicant } from "@/lib/hooks/queries/use-applicant";
import ApplicantInfoCard from "@/app/dashboard/components/ApplicantInfoCard";
import ApplicationChat from "@/app/dashboard/components/ApplicationChat";

export default function ApplicantProfilePage({
  params,
}: {
  params: Promise<{ applicantId: string }>;
}) {
  const { applicantId } = use(params);
  const { data: applicant, isLoading, error } = useApplicant(applicantId);
  const [showChat, setShowChat] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0055ba]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to load applicant</h3>
        <p className="text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (!applicant) return null;

  if (showChat) {
    return (
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        {/* Top Right Info Card */}
        <div className="absolute top-20 right-6 w-80 z-10">
          <ApplicantInfoCard
            firstName={applicant.firstName}
            lastName={applicant.lastName}
            email={applicant.email}
            phone={applicant.phone}
            bvn={applicant.bvn}
            createdAt={applicant.createdAt}
          />
        </div>

        {/* Chat Area */}
        <ApplicationChat
          applicantId={applicantId}
          applicantName={`${applicant.firstName} ${applicant.lastName}`}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Applicant Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {applicant.firstName} {applicant.lastName}
            </h2>
            <p className="text-gray-500">{applicant.email}</p>
            {applicant.phone && <p className="text-gray-500">{applicant.phone}</p>}
            {applicant.bvn && <p className="text-xs text-gray-400 font-mono mt-1">BVN: {applicant.bvn}</p>}
          </div>
          <button
            onClick={() => setShowChat(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0055ba] text-white rounded-lg hover:bg-[#004494]"
          >
            + Create Application
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600 mb-1">Applicant ID</p>
            <p className="font-mono text-sm text-gray-900">{applicant.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Created</p>
            <p className="text-sm text-gray-900">{new Date(applicant.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Bank Accounts Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Bank Accounts</h3>
        </div>
        <p className="text-gray-500 text-sm">No bank accounts linked yet.</p>
      </div>

      {/* Applications History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Loan Applications</h3>
        <p className="text-gray-500 text-sm">No applications yet. Click "Create Application" to get started.</p>
      </div>
    </div>
  );
}