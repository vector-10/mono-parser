"use client";
import { useState, useMemo } from "react";
import { useApplicants } from "@/lib/hooks/queries/use-applicants";
import { useCreateApplicant } from "@/lib/hooks/queries/use-create-applicant";
import { useUpdateApplicant, useDeleteApplicant } from "@/lib/hooks/queries/use-applicant";
import { RiSearchLine, RiCloseLine, RiUserAddLine, RiTeamLine, RiEditLine, RiDeleteBinLine } from "react-icons/ri";
import { HiArrowRight } from "react-icons/hi2";
import { toast } from "sonner";
import type { Applicant } from "@/lib/api/applicants";

function maskBvn(bvn: string) {
  return bvn.length >= 4 ? `${"•".repeat(bvn.length - 4)}${bvn.slice(-4)}` : "••••";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

type FormState = { firstName: string; lastName: string; email: string; phone: string; bvn: string };
const emptyForm: FormState = { firstName: "", lastName: "", email: "", phone: "", bvn: "" };

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#0055ba]/40 focus:bg-white transition"
      />
    </div>
  );
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const set = (key: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [key]: v }));
  const { mutate, isPending } = useCreateApplicant();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      toast.error("First name, last name and email are required");
      return;
    }
    mutate(
      { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone || undefined, bvn: form.bvn || undefined },
      {
        onSuccess: () => { toast.success("Applicant created"); onClose(); },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          toast.error(msg ?? "Failed to create applicant");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/25" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-lg w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">New Applicant</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <RiCloseLine className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name *" value={form.firstName} onChange={set("firstName")} placeholder="Ada" />
            <Field label="Last Name *" value={form.lastName} onChange={set("lastName")} placeholder="Okafor" />
          </div>
          <Field label="Email *" value={form.email} onChange={set("email")} type="email" placeholder="ada@example.com" />
          <Field label="Phone" value={form.phone} onChange={set("phone")} placeholder="+2348000000000" />
          <Field label="BVN" value={form.bvn} onChange={set("bvn")} placeholder="22xxxxxxxxx" />
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 bg-[#0055ba] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#004494] transition disabled:opacity-50 w-full justify-center"
            >
              {isPending ? "Creating…" : "Create Applicant"}
              {!isPending && <HiArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailPanel({ applicant, onClose }: { applicant: Applicant; onClose: () => void }) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [form, setForm] = useState<FormState>({
    firstName: applicant.firstName,
    lastName:  applicant.lastName,
    email:     applicant.email,
    phone:     applicant.phone ?? "",
    bvn:       applicant.bvn ?? "",
  });
  const set = (key: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [key]: v }));
  const { mutate: update, isPending: updating } = useUpdateApplicant();
  const { mutate: remove, isPending: deleting } = useDeleteApplicant();

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    update(
      { id: applicant.id, data: { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone || undefined, bvn: form.bvn || undefined } },
      { onSuccess: () => { setMode("view"); onClose(); } }
    );
  };

  const handleDelete = () => {
    remove(applicant.id, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <aside className="relative w-[420px] bg-white h-full shadow-xl overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <p className="text-sm font-semibold text-gray-900">
            {mode === "edit" ? "Edit Applicant" : mode === "delete" ? "Delete Applicant" : "Applicant Profile"}
          </p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <RiCloseLine className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {mode === "view" && (
          <div className="px-6 py-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#0055ba]/10 flex items-center justify-center shrink-0">
                <span className="text-lg font-semibold text-[#0055ba]">
                  {initials(applicant.firstName, applicant.lastName)}
                </span>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{applicant.firstName} {applicant.lastName}</p>
                <p className="text-sm text-gray-400">{applicant.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: "Phone", value: applicant.phone ?? "—" },
                { label: "BVN", value: applicant.bvn ? maskBvn(applicant.bvn) : "—" },
                { label: "Created", value: formatDate(applicant.createdAt) },
                { label: "Applicant ID", value: applicant.id, mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex items-start justify-between py-3 border-b border-gray-50">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className={`text-sm text-gray-700 text-right max-w-[240px] truncate ${mono ? "font-mono text-xs text-gray-400" : ""}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setMode("edit")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-100 text-sm font-medium text-gray-600 hover:border-gray-200 hover:text-gray-900 transition-colors"
              >
                <RiEditLine className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => setMode("delete")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-100 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <RiDeleteBinLine className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        )}

        {mode === "edit" && (
          <form onSubmit={handleUpdate} className="px-6 py-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" value={form.firstName} onChange={set("firstName")} />
              <Field label="Last Name" value={form.lastName} onChange={set("lastName")} />
            </div>
            <Field label="Email" value={form.email} onChange={set("email")} type="email" />
            <Field label="Phone" value={form.phone} onChange={set("phone")} />
            <Field label="BVN" value={form.bvn} onChange={set("bvn")} />
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={updating}
                className="flex-1 bg-[#0055ba] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#004494] transition disabled:opacity-50"
              >
                {updating ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setMode("view")}
                className="px-4 py-2.5 rounded-lg border border-gray-100 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {mode === "delete" && (
          <div className="px-6 py-6 space-y-6">
            <div className="bg-red-50 border border-red-100 rounded-xl p-5">
              <p className="text-sm font-semibold text-red-700 mb-1">Delete {applicant.firstName} {applicant.lastName}?</p>
              <p className="text-sm text-red-600 leading-relaxed">
                This will permanently delete the applicant and all associated applications and bank account data. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
              <button
                onClick={() => setMode("view")}
                className="px-4 py-2.5 rounded-lg border border-gray-100 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

export default function ApplicantsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Applicant | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: applicants = [], isLoading } = useApplicants();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return applicants;
    return applicants.filter((a) =>
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  }, [applicants, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Applicants
          </h1>
          <p className="text-sm text-gray-400 mt-1">{applicants.length} applicant{applicants.length !== 1 ? "s" : ""} on record.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-[#0055ba] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#004494] transition shadow-sm shadow-[#0055ba]/20"
        >
          <RiUserAddLine className="w-4 h-4" /> New Applicant
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-50">
          <div className="relative w-72">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#0055ba]/30 focus:bg-white transition"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-[#0055ba] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RiTeamLine className="w-8 h-8 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">{search ? "No applicants match your search" : "No applicants yet"}</p>
            {!search && (
              <p className="text-xs text-gray-300 mt-1">Applicants will appear here once created or linked via your API</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {["Applicant", "Email", "Phone", "BVN", "Created", ""].map((col) => (
                  <th key={col} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((applicant) => (
                <tr
                  key={applicant.id}
                  onClick={() => setSelected(applicant)}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#0055ba]/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-[#0055ba]">
                          {initials(applicant.firstName, applicant.lastName)}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {applicant.firstName} {applicant.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-gray-500 text-xs">{applicant.email}</td>
                  <td className="px-6 py-3.5 text-gray-500 text-xs">{applicant.phone ?? "—"}</td>
                  <td className="px-6 py-3.5 text-gray-400 font-mono text-xs">
                    {applicant.bvn ? maskBvn(applicant.bvn) : "—"}
                  </td>
                  <td className="px-6 py-3.5 text-gray-400 text-xs">{formatDate(applicant.createdAt)}</td>
                  <td className="px-6 py-3.5">
                    <RiCloseLine className="w-4 h-4 text-gray-200 rotate-45" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <DetailPanel
          applicant={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
