"use client";
import { X, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCreateApplication } from "@/lib/hooks/queries/use-create-application";

interface CreateApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateApplicationModal({ isOpen, onClose }: CreateApplicationModalProps) {
  const [formData, setFormData] = useState({
    // Applicant fields
    name: "",
    email: "",
    phone: "",
    accountId: "",
    // Loan fields
    amount: "",
    tenor: "",
    interestRate: "",
    purpose: "",
  });

  const { mutate: createApplication, isPending, isError, error } = useCreateApplication();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createApplication(
      {
        applicant: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          accountId: formData.accountId,
        },
        loan: {
          amount: Number(formData.amount),
          tenor: Number(formData.tenor),
          interestRate: Number(formData.interestRate),
          purpose: formData.purpose || undefined,
        },
      },
      {
        onSuccess: () => {
          // Reset form and close modal
          setFormData({
            name: "",
            email: "",
            phone: "",
            accountId: "",
            amount: "",
            tenor: "",
            interestRate: "",
            purpose: "",
          });
          onClose();
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Create Application</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error?.message || "Failed to create application"}
            </div>
          )}

          {/* Applicant Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent"
                  placeholder="e.g. Samuel Okon"
                />
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
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent"
                  placeholder="08012345678"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mono Account ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent"
                  placeholder="acc_xxxxxxxxxxxxx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from Mono Connect widget after user links their bank account
                </p>
              </div>
            </div>
          </div>

          {/* Loan Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount (₦) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent"
                  placeholder="100000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenor (months) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.tenor}
                  onChange={(e) => setFormData({ ...formData, tenor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent"
                  placeholder="6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Rate (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent"
                  placeholder="5.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent"
                  placeholder="Business expansion"
                />
              </div>
            </div>
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
                "Create Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}