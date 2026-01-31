"use client";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { useDeleteApplicant } from "@/lib/hooks/queries/use-applicant";
import { useRouter } from "next/navigation";

interface DeleteApplicantModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function DeleteApplicantModal({
  isOpen,
  onClose,
  applicant,
}: DeleteApplicantModalProps) {
  const { mutate: deleteApplicant, isPending } = useDeleteApplicant();
  const router = useRouter();

  const handleDelete = () => {
    deleteApplicant(applicant.id, {
      onSuccess: () => {
        router.push("/dashboard");
        onClose();
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Delete Applicant
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete{" "}
                <span className="font-semibold">
                  {applicant.firstName} {applicant.lastName}
                </span>
                ? This action cannot be undone and will delete all associated
                bank accounts and applications.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}