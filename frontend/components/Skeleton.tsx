export function Skeleton({ width = "w-full", height = "h-4" }: { width?: string; height?: string }) {
  return (
    <div className={`${width} ${height} rounded-lg bg-gray-100 relative overflow-hidden`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-linear-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}
