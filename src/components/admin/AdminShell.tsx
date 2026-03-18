"use client";

import HxNavbar from "./HxNavbar";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="hx-page">
      <HxNavbar />
      <div className="hx-container-wide">{children}</div>
    </div>
  );
}
