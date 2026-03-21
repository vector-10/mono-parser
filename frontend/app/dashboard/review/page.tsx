"use client";
import { useApplications } from "@/lib/hooks/queries/use-applications";
import { RiShieldCheckLine, RiArrowRightSLine } from "react-icons/ri";
import { TbCurrencyNaira } from "react-icons/tb";
import Link from "next/link";
import type { Application } from "@/lib/api/applications";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function scoreBand(score: number) {
  if (score >= 750) return { label: "Very Low Risk", color: "text-[#59a927]" };
  if (score >= 650) return { label: "Low Risk", color: "text-[#59a927]" };
  if (score >= 550) return { label: "Medium Risk", color: "text-amber-600" };
  if (score >= 500) return { label: "High Risk", color: "text-red-500" };
  return { label: "Very High Risk", color: "text-red-600" };
}

type DecisionData = { manual_review_reasons?: string[] };

function ReviewRow({ app }: { app: Application }) {
  const d = app.decision as DecisionData | null;
  const reasons = d?.manual_review_reasons ?? [];
  const band = app.score ? scoreBand(app.score) : null;

  return (
    <Link
      href={`/dashboard/review/${app.id}`}
      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors border-b border-gray-50 last:border-0 group"
    >
      <div className="w-9 h-9 rounded-full bg-[#0055ba]/10 flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-[#0055ba]">
          {app.applicant
            ? `${app.applicant.firstName.charAt(0)}${app.applicant.lastName.charAt(0)}`.toUpperCase()
            : "?"}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-0.5">
          <p className="text-sm font-semibold text-gray-900">
            {app.applicant
              ? `${app.applicant.firstName} ${app.applicant.lastName}`
              : "—"}
          </p>
          <span className="flex items-center gap-0.5 text-xs text-gray-500 font-mono">
            <TbCurrencyNaira className="w-3 h-3" />
            {app.amount.toLocaleString("en-NG")}
          </span>
        </div>
        {reasons.length > 0 && (
          <p className="text-xs text-gray-400 truncate">{reasons[0]}</p>
        )}
      </div>

      <div className="flex items-center gap-6 shrink-0">
        {app.score && (
          <div className="text-right">
            <p className="font-mono text-sm font-medium text-[#0055ba]">
              {app.score}
            </p>
            {band && <p className={`text-xs ${band.color}`}>{band.label}</p>}
          </div>
        )}
        <div className="text-right">
          <p className="text-xs text-gray-400">{formatDate(app.createdAt)}</p>
          {reasons.length > 1 && (
            <p className="text-xs text-gray-300">{reasons.length} triggers</p>
          )}
        </div>
        <RiArrowRightSLine className="w-4 h-4 text-gray-300 group-hover:text-[#0055ba] transition-colors" />
      </div>
    </Link>
  );
}

export default function ReviewQueuePage() {
  const { data: applications = [], isLoading } =
    useApplications("MANUAL_REVIEW");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Manual Review</h1>
        <p className="text-sm text-gray-400 mt-1">
          Applications that require a human decision before proceeding.
        </p>
      </div>

      {!isLoading && applications.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0055ba]/10 text-[#0055ba] text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0055ba] animate-pulse" />
            {applications.length} pending review
          </span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-[#0055ba] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RiShieldCheckLine className="w-10 h-10 text-gray-100 mb-4" />
            <p className="text-sm font-medium text-gray-400">Queue is clear</p>
            <p className="text-xs text-gray-300 mt-1">
              Applications flagged for manual review will appear here
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100">
              {["Applicant", "Score", "Date", ""].map((col) => (
                <p
                  key={col}
                  className="text-xs font-medium text-gray-400 uppercase tracking-wide flex-1 last:flex-none"
                >
                  {col}
                </p>
              ))}
            </div>
            {applications.map((app) => (
              <ReviewRow key={app.id} app={app} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
