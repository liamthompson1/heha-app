"use client";

import PageShell from "../PageShell";
import AdminNav from "./AdminNav";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageShell backHref="/" maxWidth="7xl">
      <AdminNav />
      <div className="mt-4">{children}</div>
    </PageShell>
  );
}
