"use client";
import { useState, useRef, useEffect } from "react";
import {
  RiSendPlaneLine,
  RiCheckLine,
  RiCloseLine,
  RiArrowRightSLine,
  RiShieldKeyholeLine,
  RiLoader4Line,
  RiArrowLeftLine,
  RiFlag2Line,
} from "react-icons/ri";
import { HiCheckCircle, HiXCircle } from "react-icons/hi2";
import { useApplication } from "@/lib/hooks/queries/use-application";
import { useManualDecision, useFlagForReview } from "@/lib/hooks/queries/use-application-action";
import { applicationsApi, type ChatMessage } from "@/lib/api/applications";
import toast from "react-hot-toast";

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function scoreBand(score: number) {
  if (score >= 750) return { label: "Very Low Risk", color: "text-[#59a927]", bar: "bg-[#59a927]", pct: 95 };
  if (score >= 650) return { label: "Low Risk", color: "text-[#59a927]", bar: "bg-[#59a927]", pct: 75 };
  if (score >= 550) return { label: "Medium Risk", color: "text-amber-500", bar: "bg-amber-400", pct: 55 };
  if (score >= 500) return { label: "High Risk", color: "text-red-500", bar: "bg-red-400", pct: 35 };
  return { label: "Very High Risk", color: "text-red-600", bar: "bg-red-500", pct: 15 };
}

type DecisionData = {
  decision?: string;
  manually_flagged?: boolean;
  manually_reviewed?: boolean;
  manual_review_reasons?: string[];
  risk_factors?: { factor: string }[];
  explainability?: {
    primary_reason?: string;
    strengths?: string[];
    weaknesses?: string[];
  };
  approval_details?: { approved_amount?: number; monthly_payment?: number; approved_tenor?: number };
  counter_offer?: { counter_amount?: number; monthly_payment?: number; counter_tenor?: number };
};

const SUGGESTED_PROMPTS = [
  "What is the main risk in this application?",
  "Can we counter-offer at a lower amount?",
  "Summarise this case for my manager.",
  "What additional documents should we request?",
];

function ChatPanel({ applicationId }: { applicationId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput("");
    setIsLoading(true);
    try {
      const reply = await applicationsApi.chat(applicationId, text, messages);
      setMessages([...updatedHistory, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...updatedHistory, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <RiShieldKeyholeLine className="w-4 h-4 text-[#0055ba]" />
          <p className="text-sm font-semibold text-gray-900">AI Review Assistant</p>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 ml-6">Ask questions about this application</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Suggested questions</p>
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 text-sm text-gray-600 hover:border-[#0055ba]/30 hover:text-gray-900 hover:bg-[#0055ba]/5 transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#0055ba] text-white rounded-br-sm"
                    : "bg-gray-50 text-gray-700 border border-gray-100 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <RiLoader4Line className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-5 py-4 border-t border-gray-100 shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 focus-within:border-[#0055ba]/30 focus-within:bg-white transition">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); }
            }}
            placeholder="Ask about this application…"
            className="flex-1 text-sm bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="text-[#0055ba] hover:text-[#003d85] disabled:text-gray-200 transition-colors"
          >
            <RiSendPlaneLine className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ReviewWorkspaceProps {
  applicationId: string;
  onBack?: () => void;
  onDecision?: () => void;
}

export default function ReviewWorkspace({ applicationId, onBack, onDecision }: ReviewWorkspaceProps) {
  const { data: app, isLoading } = useApplication(applicationId);
  const { mutate: decide, isPending: isDeciding } = useManualDecision(onDecision);
  const { mutate: flag, isPending: isFlagging } = useFlagForReview(onDecision);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-[#0055ba] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-sm text-gray-400">Application not found.</p>
      </div>
    );
  }

  const d = app.decision as DecisionData | null;
  const reasons = d?.manual_review_reasons ?? [];
  const band = app.score ? scoreBand(app.score) : null;
  const isCounter = !!d?.counter_offer;
  const terms = d?.counter_offer ?? d?.approval_details;
  const amount = isCounter ? d?.counter_offer?.counter_amount : d?.approval_details?.approved_amount;
  const tenor = isCounter ? d?.counter_offer?.counter_tenor : d?.approval_details?.approved_tenor;
  const isInReview = app.status === "MANUAL_REVIEW";

  const handleDecide = (action: "APPROVE" | "DECLINE") => {
    decide(
      { id: applicationId, action },
      {
        onSuccess: () => toast.success(action === "APPROVE" ? "Application approved" : "Application declined"),
        onError: () => toast.error("Failed to update decision"),
      },
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-100 shrink-0">
        {onBack && (
          <>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors"
            >
              <RiArrowLeftLine className="w-4 h-4" /> Queue
            </button>
            <div className="w-px h-4 bg-gray-100" />
          </>
        )}
        <p className="text-sm font-semibold text-gray-900">
          {app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName}` : "Application"}
        </p>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          !isInReview
            ? d?.decision === "APPROVED"
              ? "bg-[#59a927]/10 text-[#59a927]"
              : "bg-red-50 text-red-500"
            : "bg-[#0055ba]/10 text-[#0055ba]"
        }`}>
          {!isInReview ? (d?.decision === "APPROVED" ? "Approved" : "Declined") : "Manual Review"}
        </span>
        {d?.manually_flagged && (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-medium">
            Manually Flagged
          </span>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[420px] border-r border-gray-100 overflow-y-auto custom-scrollbar bg-white shrink-0">
          <div className="px-6 py-6 space-y-6">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Applicant</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0055ba]/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-[#0055ba]">
                    {app.applicant
                      ? `${app.applicant.firstName.charAt(0)}${app.applicant.lastName.charAt(0)}`.toUpperCase()
                      : "?"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName}` : "—"}
                  </p>
                  <p className="text-xs text-gray-400">{app.applicant?.email ?? "—"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Amount", value: formatNaira(app.amount) },
                { label: "Tenor", value: `${app.tenor} months` },
                { label: "Rate", value: `${app.interestRate}%` },
                { label: "Purpose", value: app.purpose ?? "—" },
                { label: "Submitted", value: formatDate(app.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            {app.score && band && (
              <div className="border border-gray-100 rounded-xl p-5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Credit Score</p>
                <div className="flex items-end gap-3 mb-4">
                  <p className="font-mono text-4xl font-medium text-[#0055ba]">{app.score}</p>
                  <p className={`text-sm font-medium mb-1 ${band.color}`}>{band.label}</p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                  <div className={`h-1.5 rounded-full ${band.bar} transition-all`} style={{ width: `${band.pct}%` }} />
                </div>
                {d?.explainability?.primary_reason && (
                  <p className="text-xs text-gray-500 leading-relaxed border-l-2 border-[#0055ba]/20 pl-3">
                    {d.explainability.primary_reason}
                  </p>
                )}
              </div>
            )}

            {reasons.length > 0 && (
              <div className="bg-[#0055ba]/5 border border-[#0055ba]/15 rounded-xl p-5">
                <p className="text-xs font-medium text-[#0055ba] uppercase tracking-wide mb-3">Review Triggers</p>
                <ul className="space-y-2">
                  {reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <RiArrowRightSLine className="w-4 h-4 text-[#0055ba] shrink-0 mt-0.5" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(d?.explainability?.strengths?.length || d?.explainability?.weaknesses?.length) ? (
              <div className="grid grid-cols-2 gap-4">
                {d?.explainability?.strengths && d.explainability.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[#59a927] uppercase tracking-wide mb-2">Strengths</p>
                    <ul className="space-y-1.5">
                      {d.explainability.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <HiCheckCircle className="w-3.5 h-3.5 text-[#59a927] shrink-0 mt-0.5" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {d?.explainability?.weaknesses && d.explainability.weaknesses.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-500 uppercase tracking-wide mb-2">Weaknesses</p>
                    <ul className="space-y-1.5">
                      {d.explainability.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <HiXCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" /> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            {terms && (
              <div className="bg-[#59a927]/5 border border-[#59a927]/20 rounded-xl p-4">
                <p className="text-xs font-medium text-[#59a927] uppercase tracking-wide mb-3">
                  {d?.counter_offer ? "Counter Offer Terms" : "Proposed Terms"}
                </p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Amount</p>
                    <p className="font-medium text-gray-900">{amount ? formatNaira(amount) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Tenor</p>
                    <p className="font-medium text-gray-900">{tenor ? `${tenor}mo` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Monthly</p>
                    <p className="font-medium text-gray-900">{terms?.monthly_payment ? formatNaira(terms.monthly_payment) : "—"}</p>
                  </div>
                </div>
              </div>
            )}

            {!isInReview && (
              <div className="pb-2">
                <button
                  onClick={() => flag(applicationId, {
                    onSuccess: () => toast.success("Moved to manual review"),
                    onError: () => toast.error("Failed to update status"),
                  })}
                  disabled={isFlagging}
                  className="w-full flex items-center justify-center gap-2 border border-[#0055ba]/20 text-[#0055ba] px-4 py-3 rounded-xl text-sm font-semibold hover:bg-[#0055ba]/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFlagging ? <RiLoader4Line className="w-4 h-4 animate-spin" /> : <RiFlag2Line className="w-4 h-4" />}
                  Move to Manual Review
                </button>
              </div>
            )}

            {isInReview && (
              <div className="flex gap-3 pt-2 pb-4">
                <button
                  onClick={() => handleDecide("APPROVE")}
                  disabled={isDeciding}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#59a927] text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-[#4a8f20] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeciding ? <RiLoader4Line className="w-4 h-4 animate-spin" /> : <RiCheckLine className="w-4 h-4" />}
                  Approve
                </button>
                <button
                  onClick={() => handleDecide("DECLINE")}
                  disabled={isDeciding}
                  className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-500 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeciding ? <RiLoader4Line className="w-4 h-4 animate-spin" /> : <RiCloseLine className="w-4 h-4" />}
                  Decline
                </button>
              </div>
            )}

            {!isInReview && (
              <div className={`rounded-xl p-4 text-center text-sm font-medium ${
                d?.decision === "APPROVED" ? "bg-[#59a927]/10 text-[#59a927]" : "bg-red-50 text-red-500"
              }`}>
                {d?.decision === "APPROVED" ? "This application was approved" : "This application was declined"}
                {d?.manually_reviewed && <span className="block text-xs font-normal mt-0.5 opacity-70">Manually reviewed</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white">
          <ChatPanel applicationId={applicationId} />
        </div>
      </div>
    </div>
  );
}
