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
      <h3 className="relative z-10 text-3xl sm:text-4xl font-bold mb-2 tracking-tight">{title}</h3>
      <p className="relative z-10 text-base" style={{ color: 'var(--text-secondary)' }}>{description}</p>
    </Link>
  );
}
