"use client";
import { useState, useEffect, useRef } from "react";
import { useApplications } from "@/lib/hooks/queries/use-applications";
import {
  RiShieldCheckLine,
  RiSearchLine,
} from "react-icons/ri";
import { Skeleton } from "@/components/Skeleton";
import { TbCurrencyNaira } from "react-icons/tb";
import ReviewWorkspace from "./components/ReviewWorkspace";
import type { Application } from "@/lib/api/applications";

function daysWaiting(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "1d";
  return `${days}d`;
}

function scoreBand(score: number) {
  if (score >= 750) return { label: "Very Low Risk", color: "text-[#59a927]" };
  if (score >= 650) return { label: "Low Risk", color: "text-[#59a927]" };
  if (score >= 550) return { label: "Medium Risk", color: "text-amber-600" };
  if (score >= 500) return { label: "High Risk", color: "text-red-500" };
  return { label: "Very High Risk", color: "text-red-600" };
}

type DecisionData = { manually_flagged?: boolean };

function QueueRow({
  app,
  selected,
  onSelect,
}: {
  app: Application;
  selected: boolean;
  onSelect: () => void;
}) {
  const d = app.decision as DecisionData | null;
  const band = app.score ? scoreBand(app.score) : null;
  const waiting = daysWaiting(app.updatedAt ?? app.createdAt);
  const isUrgent = waiting !== "Today" && parseInt(waiting) >= 3;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3.5 border-b border-gray-50 last:border-0 transition-colors ${
        selected ? "bg-[#0055ba]/5 border-l-2 border-l-[#0055ba]" : "hover:bg-gray-50/60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#0055ba]/10 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs font-semibold text-[#0055ba]">
            {app.applicant
              ? `${app.applicant.firstName.charAt(0)}${app.applicant.lastName.charAt(0)}`.toUpperCase()
              : "?"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName}` : "—"}
            </p>
            <span className={`text-xs shrink-0 font-medium ${isUrgent ? "text-red-400" : "text-gray-300"}`}>
              {waiting}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-xs text-gray-500 font-mono">
              <TbCurrencyNaira className="w-3 h-3" />
              {app.amount.toLocaleString("en-NG")}
            </span>
            {app.score && band && (
              <>
                <span className="text-gray-200">·</span>
                <span className={`text-xs font-medium ${band.color}`}>{app.score}</span>
              </>
            )}
            {d?.manually_flagged && (
              <>
                <span className="text-gray-200">·</span>
                <span className="text-xs text-amber-500">Flagged</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function EmptyWorkspace() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <RiShieldCheckLine className="w-12 h-12 text-gray-100 mb-4" />
      <p className="text-sm font-medium text-gray-500">Select an application</p>
      <p className="text-xs text-gray-300 mt-1">Choose from the queue to review</p>
    </div>
  );
}

export default function ReviewQueuePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: applications = [], isLoading } = useApplications(debouncedSearch ? undefined : "MANUAL_REVIEW", debouncedSearch);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    if (applications.length > 0 && !selectedId) {
      setSelectedId(applications[0].id);
    }
  }, [applications, selectedId]);

  const handleDecision = () => {
    setSelectedId(null);
  };

  return (
    <div className="-mx-6 -my-8 h-[calc(100vh-4rem)] flex">
      <div className="w-80 border-r border-gray-100 flex flex-col bg-white shrink-0">
        <div className="px-4 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Manual Review</h2>
            {!isLoading && applications.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0055ba]/10 text-[#0055ba] text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0055ba] animate-pulse" />
                {applications.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 focus-within:border-[#0055ba]/30 focus-within:bg-white transition">
            <RiSearchLine className="w-3.5 h-3.5 text-gray-300 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applicants…"
              className="flex-1 text-xs bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton width="w-3/4" height="h-4" />
              <Skeleton width="w-1/2" height="h-4" />
              <Skeleton width="w-2/3" height="h-4" />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <RiShieldCheckLine className="w-8 h-8 text-gray-100 mb-3" />
              <p className="text-xs font-medium text-gray-500">
                {debouncedSearch ? "No results" : "Queue is clear"}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {debouncedSearch ? "Try a different name" : "Nothing awaiting review"}
              </p>
            </div>
          ) : (
            applications.map((app) => (
              <QueueRow
                key={app.id}
                app={app}
                selected={selectedId === app.id}
                onSelect={() => setSelectedId(app.id)}
              />
            ))
          )}
        </div>

      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedId ? (
          <ReviewWorkspace
            applicationId={selectedId}
            onDecision={handleDecision}
          />
        ) : (
          <EmptyWorkspace />
        )}
      </div>
    </div>
  );
}
