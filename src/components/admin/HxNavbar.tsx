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

export default function HxNavbar() {
  const pathname = usePathname();

  return (
    <>
      <nav className="hx-nav">
        <div className="hx-nav-inner">
          <div className="flex items-center" style={{ gap: 40 }}>
            <Link href="/admin" className="hx-nav-brand">
              heha<span style={{ color: "#0a84ff" }}>.ai</span>
            </Link>
            <div className="hx-nav-links hidden md:flex">
              {NAV_LINKS.map((link) => {
                const active = link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      "hx-nav-link",
                      active && "hx-nav-link-active"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
      <div className="hx-nav-spacer" />
    </>
  );
}
