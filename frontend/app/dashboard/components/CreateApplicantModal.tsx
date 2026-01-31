"use client";
import { X, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateApplicant } from "@/lib/hooks/queries/use-create-applicant";

interface CreateApplicantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateApplicantModal({ isOpen, onClose }: CreateApplicantModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bvn: "",
  });

  const { mutate: createApplicant, isPending } = useCreateApplicant();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      ...(formData.phone && { phone: formData.phone }),
      ...(formData.bvn && { bvn: formData.bvn }),
    };

    createApplicant(payload, {
      onSuccess: () => {
        toast.success("Applicant created successfully!");
        setFormData({ firstName: "", lastName: "", email: "", phone: "", bvn: "" });
        onClose();
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to create applicant");
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create Applicant</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent"
                placeholder="Samuel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent"
                placeholder="Okon"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent"
              placeholder="samuel@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone (Optional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent"
              placeholder="08012345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              BVN (Optional)
            </label>
            <input
              type="text"
              value={formData.bvn}
              onChange={(e) => setFormData({ ...formData, bvn: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent"
              placeholder="22123456789"
              maxLength={11}
            />
            <p className="text-xs text-gray-500 mt-1">
             (11 digits). For user verification purposes only.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-[#0055ba] text-white rounded-lg hover:bg-[#004494] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Applicant"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}