"use client";
import { X, Loader2, Key } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useUpdateApiKey } from "@/lib/hooks/queries/use-update-api-key";

interface AddApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddApiKeyModal({ isOpen, onClose }: AddApiKeyModalProps) {
  const [monoApiKey, setMonoApiKey] = useState("");
  const { mutate: updateApiKey, isPending } = useUpdateApiKey();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateApiKey({ monoApiKey  }, {
      onSuccess: () => {
        toast.success("API keys saved successfully!");
        setMonoApiKey("");
      
        onClose();
      },
      onError: (error) => {
        toast.error(error?.message || "Failed to save API keys");
      },
    });
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0055ba]/10 rounded-lg flex items-center justify-center">
              <Key className="h-5 w-5 text-[#0055ba]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Add Mono API Keys</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mono Secret Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={monoApiKey}
              onChange={(e) => setMonoApiKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent font-mono text-sm"
              placeholder="live_sk_xxxxxxxxxxxxx"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for backend API calls
            </p>
          </div>

          

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Get your keys from:</strong>{" "}
              <a 
                href="https://app.mono.co/apps" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#0055ba] hover:underline"
              >
                Mono Dashboard
              </a>
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
              disabled={isPending || !monoApiKey.trim() }
              className="flex-1 px-4 py-2 bg-[#0055ba] text-white rounded-lg hover:bg-[#004494] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Keys"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}