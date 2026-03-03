"use client";

interface SelectionCardProps {
  icon: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export default function SelectionCard({ icon, label, selected, onClick }: SelectionCardProps) {
  return (
    <button
      type="button"
      className="selection-card"
      data-selected={selected}
      onClick={onClick}
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </button>
  );
}
