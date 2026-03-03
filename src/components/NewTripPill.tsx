"use client";

import Link from "next/link";

export default function NewTripPill() {
  return (
    <div className="floating-new-trip">
      <Link href="/trip/new" className="floating-new-trip-pill">
        <span className="new-trip-pill-label">Plan a trip</span>
        <span className="new-trip-pill-action">+ New</span>
      </Link>
    </div>
  );
}
