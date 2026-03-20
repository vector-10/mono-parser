"use client";
import { useMemo } from "react";
import { useApplications } from "@/lib/hooks/queries/use-applications";
import { useProfile } from "@/lib/hooks/queries/use-profile";
import { TbCurrencyNaira, TbTrendingUp, TbShieldCheck, TbAlertCircle } from "react-icons/tb";
import { RiArrowRightLine, RiTimeLine } from "react-icons/ri";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import type { Application } from "@/lib/api/applications";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  COMPLETED:      { label: "Completed",      color: "bg-[#59a927]/10 text-[#59a927]" },
  MANUAL_REVIEW:  { label: "Manual Review",  color: "bg-[#0055ba]/10 text-[#0055ba]" },
  PROCESSING:     { label: "Processing",     color: "bg-amber-50 text-amber-600" },
  LINKED:         { label: "Linked",         color: "bg-amber-50 text-amber-600" },
  PENDING_LINKING:{ label: "Pending Link",   color: "bg-gray-100 text-gray-500" },
  FAILED:         { label: "Failed",         color: "bg-red-50 text-red-600" },
  ABANDONED:      { label: "Abandoned",      color: "bg-gray-100 text-gray-400" },
};

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function buildChartData(applications: Application[]) {
  const counts: Record<string, number> = {};
  applications.forEach((app) => {
    const day = new Date(app.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
    counts[day] = (counts[day] ?? 0) + 1;
  });
  return Object.entries(counts)
    .slice(-14)
    .map(([date, count]) => ({ date, count }));
}

function StatCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <Icon className={`w-4 h-4 ${accent ? "text-[#0055ba]" : "text-gray-300"}`} />
      </div>
      <p className="text-3xl font-semibold text-gray-900 mb-1">
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function OverviewPage() {
  const { data: applications = [], isLoading } = useApplications();
  const { data: profile } = useProfile();

  const stats = useMemo(() => {
    const total        = applications.length;
    const completed    = applications.filter((a) => a.status === "COMPLETED");
    const review       = applications.filter((a) => a.status === "MANUAL_REVIEW").length;
    const approved     = completed.filter((a) => {
      const d = a.decision as { decision?: string } | null;
      return d?.decision === "APPROVED" || d?.decision === "COUNTER_OFFER";
    }).length;
    const approvalRate = completed.length ? Math.round((approved / completed.length) * 100) : 0;
    const avgScore     = completed.length
      ? Math.round(completed.reduce((sum, a) => sum + (a.score ?? 0), 0) / completed.length)
      : 0;
    const chartData    = buildChartData(applications);
    const recent       = [...applications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
    return { total, review, approvalRate, avgScore, chartData, recent };
  }, [applications]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-[#0055ba] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-2xl font-semibold text-gray-900 mb-1"
         
        >
          Good morning{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}.
        </h1>
        <p className="text-sm text-gray-400">Here&apos;s what&apos;s happening across your pipeline.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Applications" value={stats.total} sub="all time" icon={TbCurrencyNaira} />
        <StatCard label="Approval Rate" value={`${stats.approvalRate}%`} sub="of completed" icon={TbTrendingUp} accent />
        <StatCard label="Avg Credit Score" value={stats.avgScore || "—"} sub="completed only" icon={TbShieldCheck} />
        <StatCard label="Pending Review" value={stats.review} sub="requires action" icon={TbAlertCircle} accent={stats.review > 0} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Application Volume — Last 14 Days</p>
        </div>
        {stats.chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats.chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0055ba" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#0055ba" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ border: "1px solid #f3f4f6", borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: "#0055ba" }}
                cursor={{ stroke: "#e5e7eb" }}
              />
              <Area type="monotone" dataKey="count" name="Applications" stroke="#0055ba" strokeWidth={2} fill="url(#blueGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-sm text-gray-300">
            Not enough data yet
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Recent Applications</p>
          <Link
            href="/dashboard/applications"
            className="flex items-center gap-1 text-xs font-medium text-[#0055ba] hover:text-[#003d85] transition-colors"
          >
            View all <RiArrowRightLine className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <RiTimeLine className="w-8 h-8 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No applications yet</p>
            <p className="text-xs text-gray-300 mt-1">Applications submitted via your API will appear here</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {["Applicant", "Amount", "Score", "Decision", "Status", "Date"].map((col) => (
                  <th key={col} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recent.map((app) => {
                const d = app.decision as { decision?: string } | null;
                const decisionLabel = d?.decision ?? "—";
                const status = STATUS_LABELS[app.status] ?? { label: app.status, color: "bg-gray-100 text-gray-500" };
                return (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-900">
                      {app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName}` : "—"}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 font-mono text-xs">
                      {formatNaira(app.amount)}
                    </td>
                    <td className="px-6 py-3.5">
                      {app.score ? (
                        <span className="font-mono text-sm font-medium text-[#0055ba]">{app.score}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 text-xs">{decisionLabel}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-400 text-xs">{formatDate(app.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
