"use client";

import Link from "next/link";

interface MissingInfoCardProps {
  tripId: string;
  field: string;
  icon: string;
  title: string;
  description: string;
  variant?: "blue" | "teal" | "purple";
}

export default function MissingInfoCard({
  tripId,
  field,
  icon,
  title,
  description,
  variant = "blue",
}: MissingInfoCardProps) {
  const colorMap = {
    blue: "var(--blue)",
    teal: "var(--teal)",
    purple: "var(--purple)",
  };
  const color = colorMap[variant];

  return (
    <Link
      href={`/trip/new?tripId=${tripId}&collect=${field}`}
      className="missing-info-card"
      style={{ "--missing-accent": color } as React.CSSProperties}
    >
      <span className="missing-info-icon" style={{ color }}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          {description}
        </p>
      </div>
      <span className="missing-info-arrow" style={{ color: "var(--text-tertiary)" }}>
        →
      </span>
    </Link>
  );
}
