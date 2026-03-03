"use client";

import { useRouter } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();

  return (
    <div className="floating-search">
      <button
        type="button"
        className="floating-search-pill"
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
          Where to next...?
        </span>
      </button>
    </div>
  );
}
