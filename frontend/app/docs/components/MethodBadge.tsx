export function MethodBadge({ method }: { method: "POST" | "GET" | "DELETE" }) {
  const colours = {
    POST: "bg-[#0055ba]/10 text-[#0055ba]",
    GET: "bg-[#59a927]/10 text-[#59a927]",
    DELETE: "bg-red-50 text-red-600",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-bold font-mono ${colours[method]}`}
    >
      {method}
    </span>
  );
}
