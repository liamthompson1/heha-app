import clsx from "clsx";

interface GlassCardProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  shimmer?: boolean;
  flush?: boolean;
  elevated?: boolean;
  hoverable?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "px-5 py-5 sm:px-6",
  md: "px-6 py-6 sm:px-10",
  lg: "px-8 py-8 sm:px-12",
  xl: "px-10 py-12 sm:px-16",
};

export default function GlassCard({
  children,
  size = "md",
  shimmer,
  flush,
  elevated,
  hoverable,
  className,
}: GlassCardProps) {
  return (
    <div
      className={clsx(
        elevated ? "glass-panel-elevated" : "glass-panel",
        shimmer && "shimmer-border",
        hoverable && "glass-card-hoverable",
        flush ? "p-0" : sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
}
