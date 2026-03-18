"use client";

import { useState, useEffect } from "react";
import {
  fetchDestinations,
  type DestinationFilters,
} from "@/lib/api/destinations";
import type { Destination } from "@/types/destination";
import PageShell from "@/components/PageShell";
import DestinationCard from "@/components/destination/DestinationCard";

const CONTINENTS = [
  "All",
  "Europe",
  "Asia",
  "Africa",
  "South America",
  "North America",
  "Oceania",
];

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [continent, setContinent] = useState("All");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const filters: DestinationFilters = {};
      if (continent !== "All") filters.continent = continent;
      if (search.trim()) filters.q = search.trim();
      const data = await fetchDestinations(filters);
      setDestinations(data.filter((d) => d.published));
      setLoading(false);
    }
    load();
  }, [search, continent]);

  return (
    <PageShell backHref="/" maxWidth="7xl">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
          Explore
        </p>
        <h1 className="gradient-text-subtle mt-2 text-5xl font-bold tracking-tight sm:text-6xl">
          Destinations
        </h1>
        <p className="mt-2 text-lg" style={{ color: "var(--text-secondary)" }}>
          Comprehensive guides written and maintained by our AI travel agents.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-10 flex flex-col gap-4">
        <input
          type="text"
          placeholder="Search destinations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass-input max-w-sm"
        />
        <div className="inline-flex gap-1 self-start rounded-full border border-white/8 bg-white/[0.03] p-1">
          {CONTINENTS.map((c) => (
            <button
              key={c}
              onClick={() => setContinent(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                continent === c
                  ? "bg-white/10 text-white/90"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-panel h-72 animate-pulse opacity-30" />
          ))}
        </div>
      ) : destinations.length === 0 ? (
        <div className="py-20 text-center" style={{ color: "var(--text-tertiary)" }}>
          No destinations found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <DestinationCard key={d.id} destination={d} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
