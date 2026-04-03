import Link from "next/link";

export default function BackLink({ href }: { href: string }) {
  const isHome = href === "/";
  return (
    <Link
      href={href}
      className="fixed left-4 z-50 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-4 py-2 text-sm backdrop-blur-xl transition-all sm:left-6"
      style={{ top: 'calc(env(safe-area-inset-top) + 16px)', color: 'var(--text-secondary)', transitionTimingFunction: 'var(--ease-standard)' }}
    >
      <span aria-hidden="true">&larr;</span>
      {isHome ? "Home" : "Back"}
    </Link>
  );
}
