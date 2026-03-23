"use client";
import { useState, useRef } from "react";
import { useProfile } from "@/lib/hooks/queries/use-profile";
import { useUpdateWebhookUrl } from "@/lib/hooks/queries/use-update-webhook-url";
import { useUpdateApiKey } from "@/lib/hooks/queries/use-update-api-key";
import { useRotateApiKey } from "@/lib/hooks/queries/use-rotate-api-key";
import {
  useRiskPolicy,
  useUpdateRiskPolicy,
} from "@/lib/hooks/queries/use-risk-policy";
import type { RiskPolicy } from "@/lib/api/risk-policy";
import {
  RiFileCopyLine,
  RiCheckLine,
  RiRefreshLine,
  RiShieldKeyholeLine,
  RiEyeLine,
  RiEyeOffLine,
} from "react-icons/ri";
import { TbShieldCheck } from "react-icons/tb";
import { toast } from "sonner";
import { Tooltip } from "@/components/Tooltip";

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-0.5">{description}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg transition ${
          readOnly
            ? "bg-gray-50 border-gray-100 text-gray-500 cursor-default"
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
      {copied ? (
        <RiCheckLine className="w-3.5 h-3.5 text-[#59a927]" />
      ) : (
        <RiFileCopyLine className="w-3.5 h-3.5" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

const CREDS_STORAGE_KEY = "mp_credentials";

function ApiKeySection() {
  const { data: profile } = useProfile();
  const { mutate: rotate, isPending } = useRotateApiKey();
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [creds, setCreds] = useState<{ apiKey: string; webhookSecret: string } | null>(() => {
    try {
      const stored = localStorage.getItem(CREDS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleRotate = () => {
    rotate(undefined, {
      onSuccess: (data) => {
        setCreds(data);
        localStorage.setItem(CREDS_STORAGE_KEY, JSON.stringify(data));
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

      <div className="space-y-4">
        {creds ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">API Key</p>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                <code className="flex-1 text-xs font-mono text-gray-800 truncate">
                  {showKey ? creds.apiKey : `${"•".repeat(20)}${creds.apiKey.slice(-6)}`}
                </code>
                <button onClick={() => setShowKey((v) => !v)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                  {showKey ? <RiEyeOffLine className="w-3.5 h-3.5" /> : <RiEyeLine className="w-3.5 h-3.5" />}
                </button>
                <CopyButton value={creds.apiKey} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Webhook Secret</p>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                <code className="flex-1 text-xs font-mono text-gray-800 truncate">
                  {showSecret ? creds.webhookSecret : `${"•".repeat(20)}${creds.webhookSecret.slice(-6)}`}
                </code>
                <button onClick={() => setShowSecret((v) => !v)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                  {showSecret ? <RiEyeOffLine className="w-3.5 h-3.5" /> : <RiEyeLine className="w-3.5 h-3.5" />}
                </button>
                <CopyButton value={creds.webhookSecret} />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">Generate your API key to get started.</p>
        )}

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
              <p className="text-xs text-gray-500">
                Rotating will invalidate your current key immediately.
              </p>
            )}
          </div>
        </div>
      
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
    save(
      { webhookUrl: url },
      {
        onSuccess: () => toast.success("Webhook URL saved"),
        onError: () => toast.error("Failed to save webhook URL"),
      },
    );
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
  const { mutate: save, isPending } = useUpdateApiKey();

  const handleSave = () => {
    if (!monoApiKey) {
      toast.error("Both Mono API key and public key are required");
      return;
    }
    save(
      { monoApiKey },
      {
        onSuccess: () => {
          toast.success("Mono API key updated");
          setMonoApiKey("");
          
        },
        onError: () => toast.error("Failed to update Mono API key "),
      },
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Mono API Key
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Used to fetch bank data and run enrichments via the Mono open
            banking API.
          </p>
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
          placeholder={
            profile?.hasMonoApiKey
              ? "Enter new key to replace existing"
              : "live_sk_…"
          }
        />
        <div className="pt-1">
          <button
            onClick={handleSave}
            disabled={isPending || (!monoApiKey )}
            className="inline-flex items-center gap-2 bg-[#0055ba] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#004494] transition disabled:opacity-40"
          >
            {isPending
              ? "Saving…"
              : profile?.hasMonoApiKey
                ? "Update Mono Keys"
                : "Connect Mono"}
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
      <SectionHeader
        title="Account"
        description="Your company profile on Mono-Parser."
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name" value={profile?.name ?? ""} readOnly />
        <Field label="Company" value={profile?.companyName ?? ""} readOnly />
        <Field label="Email" value={profile?.email ?? ""} readOnly />
      </div>
    </div>
  );
}

const BRAIN_DEFAULTS: Required<Omit<RiskPolicy, "id" | "fintechId">> = {
  scoreRejectFloor: 500,
  scoreManualFloor: 600,
  scoreApproveFloor: 700,
  manualReviewBuffer: 20,
  highValueThreshold: 500000,
  affordabilityCap: 0.35,
  minViableOfferRatio: 0.3,
  thinFileIncomeMultiple: 2,
  thinFileMaxTenor: 6,
  minimumMonthlyIncome: 30000,
  incomeStalenessdays: 90,
  minAccountAgeMonths: 3,
  maxOverdrafts: 10,
  maxBouncedPayments: 3,
  maxConsecutiveFailures: 3,
};

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${
        enabled ? "bg-[#0055ba]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function PolicyNumberInput({
  label,
  fieldKey,
  value,
  disabled,
  defaultVal,
  prefix,
  suffix,
  tooltip,
  onChange,
}: {
  label: string;
  fieldKey: string;
  value: number | undefined;
  disabled: boolean;
  defaultVal: number;
  prefix?: string;
  suffix?: string;
  tooltip?: string;
  onChange: (key: string, val: number) => void;
}) {
  const displayVal = value !== undefined ? String(value) : "";
  const placeholder = String(defaultVal);

  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1.5">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <div
        className={`flex items-center border rounded-lg overflow-hidden transition ${
          disabled
            ? "bg-gray-50 border-gray-100"
            : "bg-white border-gray-200 focus-within:border-[#0055ba]/40"
        }`}
      >
        {prefix && (
          <span
            className={`px-2.5 py-2.5 text-sm border-r ${disabled ? "border-gray-100 text-gray-300 bg-gray-50" : "border-gray-200 text-gray-500"}`}
          >
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={displayVal}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(fieldKey, parseFloat(e.target.value))}
          className={`flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none ${
            disabled
              ? "text-gray-300 cursor-default placeholder-gray-300"
              : "text-gray-900 placeholder-gray-300"
          }`}
        />
        {suffix && (
          <span
            className={`px-2.5 text-sm ${disabled ? "text-gray-300" : "text-gray-500"}`}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function RiskPolicySection() {
  const { data: riskPolicy } = useRiskPolicy();
  const { mutate: save, isPending } = useUpdateRiskPolicy();
  const [enabled, setEnabled] = useState(false);
  const [form, setForm] = useState<Partial<RiskPolicy>>({});
  const syncedIdRef = useRef<string | undefined>(undefined);

  if (riskPolicy?.id && riskPolicy.id !== syncedIdRef.current) {
    syncedIdRef.current = riskPolicy.id;
    setEnabled(true);
    setForm(riskPolicy);
  }

  const handleToggle = (v: boolean) => {
    setEnabled(v);
    if (v && Object.keys(form).length === 0) {
      setForm({ ...BRAIN_DEFAULTS });
    }
  };

  const handleChange = (key: string, val: number) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    save(form, {
      onSuccess: () => toast.success("Risk policy saved"),
      onError: () => toast.error("Failed to save risk policy"),
    });
  };

  const handleReset = () => {
    setForm({ ...BRAIN_DEFAULTS });
    save(BRAIN_DEFAULTS, {
      onSuccess: () => toast.success("Reset to brain defaults"),
      onError: () => toast.error("Failed to reset"),
    });
  };

  const f = (key: keyof typeof BRAIN_DEFAULTS) =>
    (form as Record<string, number>)[key];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Risk Policy</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Override the brain&apos;s default scoring and affordability
            parameters per your lending policy.
          </p>
        </div>
        <div className="flex items-center gap-2.5 mt-0.5">
          <span
            className={`text-xs font-medium ${enabled ? "text-[#0055ba]" : "text-gray-500"}`}
          >
            {enabled ? "Custom" : "Using defaults"}
          </span>
          <Toggle enabled={enabled} onChange={handleToggle} />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Decision Thresholds</p>
            <Tooltip text="Score boundaries that determine whether a loan is automatically rejected, sent to manual review, or approved." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PolicyNumberInput
              label="Score Reject Floor"
              fieldKey="scoreRejectFloor"
              value={f("scoreRejectFloor")}
              disabled={!enabled}
              defaultVal={BRAIN_DEFAULTS.scoreRejectFloor}
              tooltip="Scores at or below this threshold are automatically rejected without review."
              onChange={handleChange}
            />
            <PolicyNumberInput
              label="Score Manual Floor"
              fieldKey="scoreManualFloor"
              value={f("scoreManualFloor")}
              disabled={!enabled}
              defaultVal={BRAIN_DEFAULTS.scoreManualFloor}
              tooltip="Scores between this and the reject floor are sent to a loan officer for manual review."
              onChange={handleChange}
            />
            <PolicyNumberInput
              label="Score Approve Floor"
              fieldKey="scoreApproveFloor"
              value={f("scoreApproveFloor")}
              disabled={!enabled}
              defaultVal={BRAIN_DEFAULTS.scoreApproveFloor}
              tooltip="Scores at or above this threshold are automatically approved, subject to affordability checks."
              onChange={handleChange}
            />
            <PolicyNumberInput
              label="Manual Review Buffer (pts)"
              fieldKey="manualReviewBuffer"
              value={f("manualReviewBuffer")}
              disabled={!enabled}
              defaultVal={BRAIN_DEFAULTS.manualReviewBuffer}
              tooltip="Extra point buffer applied near the approve floor. Borderline approvals within this range are flagged for review."
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="border-t border-gray-50 pt-6">
          <div className="flex items-center gap-1.5 mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Affordability</p>
            <Tooltip text="Controls how much of a borrower's income can go towards loan repayment and what counts as a viable loan offer." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PolicyNumberInput
              label="Affordability Cap"
              fieldKey="affordabilityCap"
              value={f("affordabilityCap")}
              disabled={!enabled}
              defaultVal={BRAIN_DEFAULTS.affordabilityCap}
              suffix="ratio"
              tooltip="Maximum share of monthly income that can go to loan repayment. 0.35 means a borrower earning ₦100k can service at most ₦35k/month."
              onChange={handleChange}
            />
            <PolicyNumberInput
              label="Min Viable Offer Ratio"
              fieldKey="minViableOfferRatio"
              value={f("minViableOfferRatio")}
              disabled={!enabled}
              defaultVal={BRAIN_DEFAULTS.minViableOfferRatio}
              suffix="ratio"
              tooltip="Minimum loan amount the brain will counter-offer, as a ratio of the original request. Below this, no counter-offer is made."
              onChange={handleChange}
            />
            <PolicyNumberInput
              label="Minimum Monthly Income"
              fieldKey="minimumMonthlyIncome"
              value={f("minimumMonthlyIncome")}
              disabled={!enabled}
              defaultVal={BRAIN_DEFAULTS.minimumMonthlyIncome}
              prefix="₦"
              tooltip="Applicants earning below this amount per month are automatically disqualified regardless of their score."
              onChange={handleChange}
            />
            <PolicyNumberInput
              label="High Value Threshold"
              fieldKey="highValueThreshold"
              value={f("highValueThreshold")}
              disabled={!enabled}
              defaultVal={BRAIN_DEFAULTS.highValueThreshold}
              prefix="₦"
              tooltip="Loan amounts above this value are flagged for additional scrutiny and may trigger a manual review regardless of score."
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="border-t border-gray-50 pt-6">
          <div className="flex items-center gap-1.5 mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Thin-File Rules</p>
            <Tooltip text="Special limits applied to applicants with limited transaction history. Restricts how much they can borrow and for how long." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <PolicyNumberInput
              label="Income Multiple (×)"
              fieldKey="thinFileIncomeMultiple"
              value={f("thinFileIncomeMultiple")}
              disabled={!enabled}
              defaultVal={BRAIN_DEFAULTS.thinFileIncomeMultiple}
              tooltip="For thin-file applicants, the loan amount cannot exceed this multiple of their monthly income."
              onChange={handleChange}
            />
            <PolicyNumberInput
              label="Max Tenor (months)"
              fieldKey="thinFileMaxTenor"
              value={f("thinFileMaxTenor")}
              disabled={!enabled}
              defaultVal={BRAIN_DEFAULTS.thinFileMaxTenor}
              suffix="mo"
              tooltip="Maximum repayment period allowed for applicants with limited transaction history."
              onChange={handleChange}
            />
            <PolicyNumberInput
              label="Income Staleness (days)"
              fieldKey="incomeStalenessdays"
              value={f("incomeStalenessdays")}
              disabled={!enabled}
              defaultVal={BRAIN_DEFAULTS.incomeStalenessdays}
              suffix="d"
              tooltip="If the most recent verified income is older than this many days, it is considered stale and will affect the score negatively."
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="border-t border-gray-50 pt-6">
          <div className="flex items-center gap-1.5 mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Knockout Limits</p>
            <Tooltip text="Hard limits that automatically disqualify an applicant before scoring. Breaching any of these results in an immediate rejection." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PolicyNumberInput
              label="Min Account Age (months)"
              fieldKey="minAccountAgeMonths"
              value={f("minAccountAgeMonths")}
              disabled={!enabled}
              defaultVal={BRAIN_DEFAULTS.minAccountAgeMonths}
              suffix="mo"
              tooltip="Bank accounts younger than this are rejected outright. Ensures sufficient transaction history exists for analysis."
              onChange={handleChange}
            />
            <PolicyNumberInput
              label="Max Overdrafts"
              fieldKey="maxOverdrafts"
              value={f("maxOverdrafts")}
              disabled={!enabled}
              defaultVal={BRAIN_DEFAULTS.maxOverdrafts}
              tooltip="Maximum number of overdraft incidents allowed in the transaction history. Exceeding this triggers an automatic rejection."
              onChange={handleChange}
            />
            <PolicyNumberInput
              label="Max Bounced Payments"
              fieldKey="maxBouncedPayments"
              value={f("maxBouncedPayments")}
              disabled={!enabled}
              defaultVal={BRAIN_DEFAULTS.maxBouncedPayments}
              tooltip="Maximum number of returned or bounced payments allowed. High bounce counts signal inability to meet obligations."
              onChange={handleChange}
            />
            <PolicyNumberInput
              label="Max Consecutive Failures"
              fieldKey="maxConsecutiveFailures"
              value={f("maxConsecutiveFailures")}
              disabled={!enabled}
              defaultVal={BRAIN_DEFAULTS.maxConsecutiveFailures}
              tooltip="Maximum number of consecutive failed debits or missed payments before automatic disqualification."
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {enabled && (
        <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-50">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-[#0055ba] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#004494] transition disabled:opacity-50 shadow-sm shadow-[#0055ba]/20"
          >
            {isPending ? "Saving…" : "Save Changes"}
          </button>
          <button
            onClick={handleReset}
            disabled={isPending}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition"
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your API credentials, integrations, and account details.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AccountSection />
        <ApiKeySection />
        <WebhookUrlSection />
        <MonoIntegrationSection />
      </div>

      <RiskPolicySection />
    </div>
  );
}
