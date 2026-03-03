import Link from "next/link";

export default function BackLink({ href }: { href: string }) {
  const isHome = href === "/";
  return (
    <Link
      href={href}
      className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-4 py-2 text-sm backdrop-blur-xl transition-all sm:left-6 sm:top-6"
      style={{ color: 'var(--text-secondary)', transitionTimingFunction: 'var(--ease-standard)' }}
    >
      <span aria-hidden="true">&larr;</span>
      {isHome ? "Home" : "Back"}
    </Link>
  );
}
