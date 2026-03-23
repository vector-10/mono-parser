"use client";
import { useState, useMemo } from "react";
import { useApplications } from "@/lib/hooks/queries/use-applications";
import {
  RiSearchLine,
  RiCloseLine,
  RiArrowRightSLine,
  RiFileList3Line,
} from "react-icons/ri";
import { TbCurrencyNaira } from "react-icons/tb";
import { Skeleton } from "@/components/Skeleton";
import { HiCheckCircle, HiXCircle } from "react-icons/hi2";
import type { Application } from "@/lib/api/applications";

const STATUSES = [
  { key: "all", label: "All" },
  { key: "PROCESSING", label: "Processing" },
  { key: "LINKED", label: "Linked" },
  { key: "COMPLETED", label: "Completed" },
  { key: "MANUAL_REVIEW", label: "Manual Review" },
  { key: "FAILED", label: "Failed" },
  { key: "ABANDONED", label: "Abandoned" },
];

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "bg-[#59a927]/10 text-[#59a927]",
  MANUAL_REVIEW: "bg-[#0055ba]/10 text-[#0055ba]",
  PROCESSING: "bg-amber-50 text-amber-600",
  LINKED: "bg-amber-50 text-amber-600",
  PENDING_LINKING: "bg-gray-100 text-gray-500",
  FAILED: "bg-red-50 text-red-600",
  ABANDONED: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "Completed",
  MANUAL_REVIEW: "Manual Review",
  PROCESSING: "Processing",
  LINKED: "Linked",
  PENDING_LINKING: "Pending Link",
  FAILED: "Failed",
  ABANDONED: "Abandoned",
};

const DECISION_STYLE: Record<string, string> = {
  APPROVED: "text-[#59a927]",
  COUNTER_OFFER: "text-amber-600",
  REJECTED: "text-red-600",
  MANUAL_REVIEW: "text-[#0055ba]",
};

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

function scoreBand(score: number): string {
  if (score >= 750) return "Very Low Risk";
  if (score >= 650) return "Low Risk";
  if (score >= 550) return "Medium Risk";
  if (score >= 500) return "High Risk";
  return "Very High Risk";
}

type DecisionData = {
  decision?: string;
  score_band?: string;
  manual_review_reasons?: string[];
  approval_details?: {
    approved_amount?: number;
    monthly_payment?: number;
    approved_tenor?: number;
  };
  counter_offer?: {
    counter_amount?: number;
    monthly_payment?: number;
    counter_tenor?: number;
  };
  explainability?: {
    primary_reason?: string;
    strengths?: string[];
    weaknesses?: string[];
  };
  risk_factors?: { factor: string; severity?: string }[];
};

function DetailPanel({
  app,
  onClose,
}: {
  app: Application;
  onClose: () => void;
}) {
  const d = app.decision as DecisionData | null;
  const decisionKey = d?.decision ?? "";

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <aside className="relative w-[480px] bg-white h-full shadow-xl overflow-y-auto custom-scrollbar animate-fade-up">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <p className="text-sm font-semibold text-gray-900">
            Application Details
          </p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RiCloseLine className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Applicant
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0055ba]/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-[#0055ba]">
                  {app.applicant?.firstName?.charAt(0).toUpperCase() ?? "?"}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {app.applicant
                    ? `${app.applicant.firstName} ${app.applicant.lastName}`
                    : "—"}
                </p>
                <p className="text-xs text-gray-500">
                  {app.applicant?.email ?? "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Loan Amount</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatNaira(app.amount)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Tenor</p>
              <p className="text-lg font-semibold text-gray-900">
                {app.tenor} months
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Interest Rate</p>
              <p className="text-lg font-semibold text-gray-900">
                {app.interestRate}%
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Purpose</p>
              <p className="text-sm text-gray-700">{app.purpose ?? "—"}</p>
            </div>
          </div>

          {app.score && (
            <div className="border border-gray-100 rounded-xl p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
                Credit Assessment
              </p>
              <div className="flex items-end gap-4 mb-4">
                <p className="font-mono text-4xl font-medium text-[#0055ba]">
                  {app.score}
                </p>
                <div className="mb-1">
                  <p className="text-xs text-gray-500">
                    {scoreBand(app.score)}
                  </p>
                  {decisionKey && (
                    <span
                      className={`text-sm font-semibold ${DECISION_STYLE[decisionKey] ?? "text-gray-600"}`}
                    >
                      {decisionKey.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>

              {d?.explainability?.primary_reason && (
                <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-[#0055ba]/20 pl-3">
                  {d.explainability.primary_reason}
                </p>
              )}
            </div>
          )}

          {(d?.approval_details || d?.counter_offer) && (
            <div className="bg-[#59a927]/5 border border-[#59a927]/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <HiCheckCircle className="w-4 h-4 text-[#59a927]" />
                <p className="text-xs font-medium text-[#59a927] uppercase tracking-wide">
                  {d.counter_offer ? "Counter Offer" : "Approved Terms"}
                </p>
              </div>
              {(() => {
                const co = d?.counter_offer;
                const ad = d?.approval_details;
                const amount = co ? co.counter_amount : ad?.approved_amount;
                const tenor = co ? co.counter_tenor : ad?.approved_tenor;
                const monthly = co?.monthly_payment ?? ad?.monthly_payment;
                return (
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Amount</p>
                      <p className="font-medium text-gray-900">
                        {amount ? formatNaira(amount) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Tenor</p>
                      <p className="font-medium text-gray-900">
                        {tenor ? `${tenor}mo` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Monthly</p>
                      <p className="font-medium text-gray-900">
                        {monthly ? formatNaira(monthly) : "—"}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {d?.manual_review_reasons && d.manual_review_reasons.length > 0 && (
            <div className="bg-[#0055ba]/5 border border-[#0055ba]/15 rounded-xl p-5">
              <p className="text-xs font-medium text-[#0055ba] uppercase tracking-wide mb-3">
                Review Triggers
              </p>
              <ul className="space-y-2">
                {d.manual_review_reasons.map((reason, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <RiArrowRightSLine className="w-4 h-4 text-[#0055ba] shrink-0 mt-0.5" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {d?.risk_factors && d.risk_factors.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Risk Factors
              </p>
              <ul className="space-y-2">
                {d.risk_factors.map((rf, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <HiXCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    {rf.factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {d?.explainability && (
            <div className="grid grid-cols-2 gap-4">
              {d.explainability.strengths &&
                d.explainability.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[#59a927] uppercase tracking-wide mb-2">
                      Strengths
                    </p>
                    <ul className="space-y-1.5">
                      {d.explainability.strengths.map((s, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-gray-600"
                        >
                          <HiCheckCircle className="w-3.5 h-3.5 text-[#59a927] shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              {d.explainability.weaknesses &&
                d.explainability.weaknesses.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-500 uppercase tracking-wide mb-2">
                      Weaknesses
                    </p>
                    <ul className="space-y-1.5">
                      {d.explainability.weaknesses.map((w, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-gray-600"
                        >
                          <HiXCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}

          <div className="pt-2 border-t border-gray-50">
            <p className="text-xs text-gray-300 font-mono">{app.id}</p>
            <p className="text-xs text-gray-500 mt-1">
              Created {formatDate(app.createdAt)}
            </p>
            {app.processedAt && (
              <p className="text-xs text-gray-500">
                Processed {formatDate(app.processedAt)}
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function ApplicationsPage() {
  const [activeStatus, setActiveStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);

  const { data: applications = [], isLoading } = useApplications(
    activeStatus === "all" ? undefined : activeStatus,
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return applications;
    return applications.filter((a) => {
      const name = a.applicant
        ? `${a.applicant.firstName} ${a.applicant.lastName}`.toLowerCase()
        : "";
      return name.includes(q) || a.id.toLowerCase().includes(q);
    });
  }, [applications, search]);

  const counts = useMemo(() => {
    const all = applications;
    return Object.fromEntries(
      STATUSES.map(({ key }) => [
        key,
        key === "all" ? all.length : all.filter((a) => a.status === key).length,
      ]),
    );
  }, [applications]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
        <p className="text-sm text-gray-500 mt-1">
          All loan applications submitted through your API.
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUSES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveStatus(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeStatus === key
                ? "bg-[#0055ba] text-white"
                : "bg-white border border-gray-100 text-gray-500 hover:text-gray-900 hover:border-gray-200"
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span
                className={`text-xs ${activeStatus === key ? "opacity-70" : "text-gray-500"}`}
              >
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-50">
          <div className="relative w-72">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#0055ba]/30 focus:bg-white transition"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton width="w-3/4" height="h-4" />
            <Skeleton width="w-1/2" height="h-4" />
            <Skeleton width="w-2/3" height="h-4" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RiFileList3Line className="w-8 h-8 text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">No applications found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {[
                  "Applicant",
                  "Amount",
                  "Tenor",
                  "Score",
                  "Decision",
                  "Status",
                  "Date",
                  "",
                ].map((col) => (
                  <th
                    key={col}
                    className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((app) => {
                const d = app.decision as DecisionData | null;
                const decisionKey = d?.decision ?? "";
                const status =
                  STATUS_STYLE[app.status] ?? "bg-gray-100 text-gray-500";
                const statusLabel = STATUS_LABEL[app.status] ?? app.status;
                return (
                  <tr
                    key={app.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelected(app)}
                  >
                    <td className="px-6 py-3.5 font-medium text-gray-900">
                      {app.applicant
                        ? `${app.applicant.firstName} ${app.applicant.lastName}`
                        : "—"}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-600">
                      <span className="flex items-center gap-0.5">
                        <TbCurrencyNaira className="w-3 h-3" />
                        {app.amount.toLocaleString("en-NG")}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">
                      {app.tenor}mo
                    </td>
                    <td className="px-6 py-3.5">
                      {app.score ? (
                        <span className="font-mono text-sm font-medium text-[#0055ba]">
                          {app.score}
                        </span>
                      ) : (
                        <span className="text-gray-200">—</span>
                      )}
                    </td>
                    <td
                      className={`px-6 py-3.5 text-xs font-medium ${DECISION_STYLE[decisionKey] ?? "text-gray-300"}`}
                    >
                      {decisionKey ? decisionKey.replace("_", " ") : "—"}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="px-6 py-3.5">
                      <RiArrowRightSLine className="w-4 h-4 text-gray-300" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <DetailPanel app={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
