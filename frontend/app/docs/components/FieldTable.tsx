export function FieldTable({
  fields,
}: {
  fields: { name: string; type: string; required?: boolean; desc: string }[];
}) {
  return (
    <div className="overflow-x-auto my-4 border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wide">Field</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wide">Type</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wide hidden sm:table-cell">Required</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wide">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {fields.map((f) => (
            <tr key={f.name} className="hover:bg-gray-50 transition">
              <td className="px-4 py-3 font-mono text-xs text-[#0055ba] font-semibold whitespace-nowrap">{f.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{f.type}</td>
              <td className="px-4 py-3 hidden sm:table-cell">
                {f.required !== false ? (
                  <span className="text-xs font-medium text-red-600">Yes</span>
                ) : (
                  <span className="text-xs text-gray-500">No</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs leading-relaxed">{f.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
