"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/destinations", label: "Destinations" },
  { href: "/admin/bots", label: "Bots" },
  { href: "/admin/review", label: "Review" },
  { href: "/destinations", label: "Public Site" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 rounded-full border border-white/8 bg-white/5 px-2 py-1.5 backdrop-blur-xl w-fit">
      {NAV_LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              active
                ? "bg-white/10 text-white/90"
                : "text-white/40 hover:text-white/60"
            )}
            style={{ transitionTimingFunction: "var(--ease-standard)" }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
