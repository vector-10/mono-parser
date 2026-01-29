"use client";
import { use } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useApplicant } from "@/lib/hooks/queries/use-applicant";
import ApplicationChat from "@/app/dashboard/components/ApplicationChat";

export default function ApplicantChatPage({
  params,
}: {
  params: Promise<{ applicantId: string }>;
}) {
  const { applicantId } = use(params);
  const { data: applicant, isLoading, error } = useApplicant(applicantId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0055ba]" />
      </div>
    );
  }

  if (error || !applicant) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold">Failed to load applicant</h3>
      </div>
    );
  }

  return (
    <ApplicationChat
      applicantId={applicantId}
      applicantName={`${applicant.firstName} ${applicant.lastName}`}
    />
  );
}