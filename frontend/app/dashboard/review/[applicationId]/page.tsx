"use client";
import { useParams, useRouter } from "next/navigation";
import ReviewWorkspace from "../components/ReviewWorkspace";

export default function ReviewWorkspacePage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const router = useRouter();

  return (
    <div className="-mx-6 -my-8 h-[calc(100vh-4rem)] flex flex-col">
      <ReviewWorkspace
        applicationId={applicationId}
        onBack={() => router.push("/dashboard/review")}
      />
    </div>
  );
}
