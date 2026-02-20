"use client";
import { X, Loader2, Key, Copy, Check, Globe } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useUpdateApiKey } from "@/lib/hooks/queries/use-update-api-key";
import { useUpdateWebhookUrl } from "@/lib/hooks/queries/use-update-webhook-url";
import { useProfile } from "@/lib/hooks/queries/use-profile";

interface AddApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddApiKeyModal({ isOpen, onClose }: AddApiKeyModalProps) {
  const [monoApiKey, setMonoApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: profile } = useProfile();
  const { mutate: updateApiKey, isPending: isSavingMonoKey } = useUpdateApiKey();
  const { mutate: updateWebhookUrl, isPending: isSavingWebhook } = useUpdateWebhookUrl();

  const handleCopyApiKey = () => {
    if (!profile?.apiKey) return;
    navigator.clipboard.writeText(profile.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveMonoKey = (e: React.FormEvent) => {
    e.preventDefault();
    updateApiKey({ monoApiKey }, {
      onSuccess: () => {
        toast.success("Mono API key saved successfully!");
        setMonoApiKey("");
      },
      onError: (error) => {
        toast.error(error?.message || "Failed to save Mono API key");
      },
    });
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    updateWebhookUrl({ webhookUrl }, {
      onSuccess: () => {
        toast.success("Webhook URL saved successfully!");
        setWebhookUrl("");
      },
      onError: (error) => {
        toast.error(error?.message || "Failed to save webhook URL");
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0055ba]/10 rounded-lg flex items-center justify-center">
              <Key className="h-5 w-5 text-[#0055ba]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">API Keys & Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* Section 1 — Platform API Key (read-only, copy) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Platform API Key
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Send this as <code className="bg-gray-100 px-1 rounded">x-api-key</code> on all server-to-server requests to our API.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={profile?.apiKey ?? "Loading..."}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs text-gray-700 cursor-default"
              />
              <button
                type="button"
                onClick={handleCopyApiKey}
                disabled={!profile?.apiKey}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
                title="Copy API key"
              >
                {copied
                  ? <Check className="h-4 w-4 text-green-600" />
                  : <Copy className="h-4 w-4 text-gray-600" />
                }
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Section 2 — Mono API Key */}
          <form onSubmit={handleSaveMonoKey} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mono Secret Key <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Your Mono API key — we use this to call Mono on your behalf. Never exposed to your applicants.{" "}
                <a
                  href="https://app.mono.co/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0055ba] hover:underline"
                >
                  Get it from Mono Dashboard →
                </a>
              </p>
              <input
                type="text"
                value={monoApiKey}
                onChange={(e) => setMonoApiKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent font-mono text-sm"
                placeholder="live_sk_xxxxxxxxxxxxx"
              />
            </div>
            <button
              type="submit"
              disabled={isSavingMonoKey || !monoApiKey.trim()}
              className="w-full px-4 py-2 bg-[#0055ba] text-white rounded-lg hover:bg-[#004494] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isSavingMonoKey
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                : "Save Mono Key"
              }
            </button>
          </form>

          <div className="border-t border-gray-100" />

          {/* Section 3 — Webhook URL */}
          <form onSubmit={handleSaveWebhook} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Globe className="inline h-4 w-4 mr-1 text-gray-500" />
                Webhook URL
              </label>
              <p className="text-xs text-gray-500 mb-2">
                We POST events to this URL —{" "}
                <code className="bg-gray-100 px-1 rounded">account.linked</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">account.enrichment_ready</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">application.decision</code>.
              </p>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent text-sm"
                placeholder="https://your-server.com/webhooks/mono-parser"
              />
              {profile?.webhookUrl && (
                <p className="text-xs text-gray-400 mt-1">
                  Current: {profile.webhookUrl}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSavingWebhook || !webhookUrl.trim()}
              className="w-full px-4 py-2 bg-[#0055ba] text-white rounded-lg hover:bg-[#004494] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isSavingWebhook
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                : "Save Webhook URL"
              }
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
