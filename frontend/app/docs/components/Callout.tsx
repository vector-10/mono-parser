import { RiShieldLine, RiAlertLine, RiCheckLine } from "react-icons/ri";

export function Callout({
  type,
  children,
}: {
  type: "info" | "warning" | "success";
  children: React.ReactNode;
}) {
  const styles = {
    info: "bg-white border-[#0055ba]/20 text-[#003d85]",
    warning: "bg-white border-amber-200 text-amber-800",
    success: "bg-white border-[#59a927]/20 text-[#3a6e18]",
  };
  const icons = {
    info: <RiShieldLine className="h-4 w-4 shrink-0 mt-0.5" />,
    warning: <RiAlertLine className="h-4 w-4 shrink-0 mt-0.5" />,
    success: <RiCheckLine className="h-4 w-4 shrink-0 mt-0.5" />,
  };
  return (
    <div className={`flex gap-3 border rounded-lg p-4 text-sm my-4 ${styles[type]}`}>
      {icons[type]}
      <div>{children}</div>
    </div>
  );
}
