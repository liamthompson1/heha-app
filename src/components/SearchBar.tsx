"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();

  return (
    <div className="floating-bottom-bar">
      <div className="floating-bottom-bar-inner">
        {/* Search pill */}
        <button
          type="button"
          className="floating-bar-search"
          onClick={() => router.push("/trip/new")}
        >
          <svg
            className="search-bar-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx={11} cy={11} r={8} />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <span className="search-bar-placeholder">
            Where do you want to go?
          </span>
        </button>

        {/* New trip pill */}
        <Link href="/trip/new" className="floating-bar-new-trip">
          <span className="new-trip-pill-label">Plan a trip</span>
          <span className="new-trip-pill-action">+ New</span>
        </Link>
      </div>
    </div>
  );
}
