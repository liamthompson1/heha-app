export default function StatCard({
  label,
  value,
  icon,
  color = "#5AC8FA",
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}) {
  return (
    <div className="glass-panel flex flex-col gap-3 px-5 py-5">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
        style={{
          background: `linear-gradient(135deg, ${color}26, ${color}0d)`,
          border: `1px solid ${color}33`,
        }}
      >
        {icon}
      </div>
      <div
        className="text-3xl font-bold tracking-tight"
        style={{ color: "var(--foreground)" }}
      >
        {value}
      </div>
      <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </div>
    </div>
  );
}
