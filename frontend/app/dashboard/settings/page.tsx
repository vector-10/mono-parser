"use client";
import { useState } from "react";
import { useProfile } from "@/lib/hooks/queries/use-profile";
import { useUpdateWebhookUrl } from "@/lib/hooks/queries/use-update-webhook-url";
import { useUpdateApiKey } from "@/lib/hooks/queries/use-update-api-key";
import { useRotateApiKey } from "@/lib/hooks/queries/use-rotate-api-key";
import { RiFileCopyLine, RiCheckLine, RiRefreshLine, RiEyeLine, RiEyeOffLine, RiShieldKeyholeLine } from "react-icons/ri";
import { TbShieldCheck } from "react-icons/tb";
import { toast } from "sonner";

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-400 mt-0.5">{description}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, readOnly = false }: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg transition ${
          readOnly
            ? "bg-gray-50 border-gray-100 text-gray-400 cursor-default"
            : "bg-white border-gray-200 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#0055ba]/40"
        }`}
      />
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
    >
      {copied ? <RiCheckLine className="w-3.5 h-3.5 text-[#59a927]" /> : <RiFileCopyLine className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function RevealedCredentials({ apiKey, webhookSecret, onDismiss }: {
  apiKey: string; webhookSecret: string; onDismiss: () => void;
}) {
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <RiShieldKeyholeLine className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Save these now — they won&apos;t be shown again</p>
          <p className="text-xs text-amber-600 mt-0.5">Copy both values before leaving this page. Your previous key has been invalidated.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1.5">API Key</p>
          <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2.5">
            <code className="flex-1 text-xs font-mono text-gray-800 truncate">
              {showKey ? apiKey : `${"•".repeat(20)}${apiKey.slice(-6)}`}
            </code>
            <button onClick={() => setShowKey(!showKey)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
              {showKey ? <RiEyeOffLine className="w-3.5 h-3.5" /> : <RiEyeLine className="w-3.5 h-3.5" />}
            </button>
            <CopyButton value={apiKey} />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1.5">Webhook Secret</p>
          <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2.5">
            <code className="flex-1 text-xs font-mono text-gray-800 truncate">
              {showSecret ? webhookSecret : `${"•".repeat(20)}${webhookSecret.slice(-6)}`}
            </code>
            <button onClick={() => setShowSecret(!showSecret)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
              {showSecret ? <RiEyeOffLine className="w-3.5 h-3.5" /> : <RiEyeLine className="w-3.5 h-3.5" />}
            </button>
            <CopyButton value={webhookSecret} />
          </div>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors underline underline-offset-2"
      >
        I&apos;ve saved both values
      </button>
    </div>
  );
}

function ApiKeySection() {
  const { data: profile } = useProfile();
  const { mutate: rotate, isPending } = useRotateApiKey();
  const [revealed, setRevealed] = useState<{ apiKey: string; webhookSecret: string } | null>(null);

  const handleRotate = () => {
    rotate(undefined, {
      onSuccess: (data) => {
        setRevealed(data);
        toast.success("API key rotated successfully");
      },
      onError: () => toast.error("Failed to rotate API key"),
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <SectionHeader
        title="API Credentials"
        description="Your API key authenticates requests to Mono-Parser. Your webhook secret is used to verify incoming webhook signatures."
      />

      {revealed ? (
        <RevealedCredentials
          apiKey={revealed.apiKey}
          webhookSecret={revealed.webhookSecret}
          onDismiss={() => setRevealed(null)}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TbShieldCheck className={`w-4 h-4 ${profile?.hasApiKey ? "text-[#59a927]" : "text-gray-300"}`} />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">API Key</p>
              </div>
              <p className={`text-sm font-medium ${profile?.hasApiKey ? "text-gray-900" : "text-gray-400"}`}>
                {profile?.hasApiKey ? "Active" : "Not set"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Stored as a hash — not recoverable</p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TbShieldCheck className={`w-4 h-4 ${profile?.hasWebhookSecret ? "text-[#59a927]" : "text-gray-300"}`} />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Webhook Secret</p>
              </div>
              <p className={`text-sm font-medium ${profile?.hasWebhookSecret ? "text-gray-900" : "text-gray-400"}`}>
                {profile?.hasWebhookSecret ? "Active" : "Not set"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Used to verify webhook payloads</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleRotate}
              disabled={isPending}
              className="inline-flex items-center gap-2 bg-[#0055ba] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#004494] transition disabled:opacity-50 shadow-sm shadow-[#0055ba]/20"
            >
              <RiRefreshLine className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
              {isPending ? "Rotating…" : profile?.hasApiKey ? "Rotate API Key" : "Generate API Key"}
            </button>
            {profile?.hasApiKey && (
              <p className="text-xs text-gray-400">Rotating will invalidate your current key immediately.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WebhookUrlSection() {
  const { data: profile } = useProfile();
  const [url, setUrl] = useState(profile?.webhookUrl ?? "");
  const { mutate: save, isPending } = useUpdateWebhookUrl();

  const handleSave = () => {
    if (!url.startsWith("https://")) {
      toast.error("Webhook URL must start with https://");
      return;
    }
    save({ webhookUrl: url }, {
      onSuccess: () => toast.success("Webhook URL saved"),
      onError: () => toast.error("Failed to save webhook URL"),
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <SectionHeader
        title="Webhook URL"
        description="Mono-Parser will POST application events to this endpoint. Must be HTTPS."
      />
      <div className="flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-server.com/webhooks/mono-parser"
          className="flex-1 px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#0055ba]/40 transition"
        />
        <button
          onClick={handleSave}
          disabled={isPending || !url}
          className="px-4 py-2.5 rounded-lg bg-[#0055ba] text-white text-sm font-semibold hover:bg-[#004494] transition disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function MonoIntegrationSection() {
  const { data: profile } = useProfile();
  const [monoApiKey, setMonoApiKey] = useState("");
  const [monoPublicKey, setMonoPublicKey] = useState("");
  const { mutate: save, isPending } = useUpdateApiKey();

  const handleSave = () => {
    if (!monoApiKey || !monoPublicKey) {
      toast.error("Both Mono API key and public key are required");
      return;
    }
    save({ monoApiKey, monoPublicKey }, {
      onSuccess: () => {
        toast.success("Mono integration updated");
        setMonoApiKey("");
        setMonoPublicKey("");
      },
      onError: () => toast.error("Failed to update Mono integration"),
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Mono Integration</h2>
          <p className="text-sm text-gray-400 mt-0.5">Used to fetch bank data and run enrichments via the Mono open banking API.</p>
        </div>
        {profile?.hasMonoApiKey && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#59a927]/10 text-[#59a927] text-xs font-medium">
            <TbShieldCheck className="w-3.5 h-3.5" /> Connected
          </span>
        )}
      </div>

      <div className="space-y-4">
        <Field
          label="Mono Secret Key"
          value={monoApiKey}
          onChange={setMonoApiKey}
          type="password"
          placeholder={profile?.hasMonoApiKey ? "Enter new key to replace existing" : "live_sk_…"}
        />
        <Field
          label="Mono Public Key"
          value={monoPublicKey}
          onChange={setMonoPublicKey}
          placeholder={profile?.hasMonoApiKey ? "Enter new key to replace existing" : "live_pk_…"}
        />
        <div className="pt-1">
          <button
            onClick={handleSave}
            disabled={isPending || (!monoApiKey && !monoPublicKey)}
            className="inline-flex items-center gap-2 bg-[#0055ba] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#004494] transition disabled:opacity-40"
          >
            {isPending ? "Saving…" : profile?.hasMonoApiKey ? "Update Mono Keys" : "Connect Mono"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountSection() {
  const { data: profile } = useProfile();

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <SectionHeader title="Account" description="Your company profile on Mono-Parser." />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name" value={profile?.name ?? ""} readOnly />
        <Field label="Company" value={profile?.companyName ?? ""} readOnly />
        <Field label="Email" value={profile?.email ?? ""} readOnly />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your API credentials, integrations, and account details.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AccountSection />
        <ApiKeySection />
        <WebhookUrlSection />
        <MonoIntegrationSection />
      </div>
    </div>
  );
}
