import Link from "next/link";
import clsx from "clsx";

interface PathCardProps {
  href: string;
  title: string;
  description: string;
  color: "coral" | "purple";
}

export default function PathCard({ href, title, description, color }: PathCardProps) {
  return (
    <Link
      href={href}
      className={clsx("path-card", `path-card-${color}`)}
    >
      <h3 className="relative z-10 text-2xl font-bold mb-1">{title}</h3>
      <p className="relative z-10 text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
    </Link>
  );
}
