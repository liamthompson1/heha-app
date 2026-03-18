export default function StatCard({
  label,
  value,
  icon,
  color = "#0a84ff",
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}) {
  return (
    <div className="hx-glass hx-stat">
      <div
        className="hx-stat-icon"
        style={{
          background: `linear-gradient(135deg, ${color}26, ${color}0d)`,
          border: `0.5px solid ${color}33`,
        }}
      >
        {icon}
      </div>
      <div className="hx-stat-value">{value}</div>
      <div className="hx-stat-label">{label}</div>
    </div>
  );
}
