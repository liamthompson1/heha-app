"use client";

import { useState, useEffect } from "react";
import {
  fetchDestinations,
  type DestinationFilters,
} from "@/lib/api/destinations";
import type { Destination } from "@/types/destination";
import HxNavbar from "@/components/admin/HxNavbar";
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
    <div className="hx-page">
      <HxNavbar />

      <div className="hx-container">
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p className="hx-eyebrow" style={{ marginBottom: 8 }}>
            Explore
          </p>
          <h1
            className="hx-heading"
            style={{ fontSize: "clamp(40px, 8vw, 64px)" }}
          >
            Destinations
          </h1>
          <p
            className="hx-text-secondary"
            style={{ fontSize: 17, marginTop: 8 }}
          >
            Comprehensive guides written and maintained by our AI travel agents.
          </p>
        </div>

        {/* Search + Filters */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <input
            type="text"
            placeholder="Search destinations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="hx-input"
            style={{ maxWidth: 400 }}
          />
          <div className="hx-tabs" style={{ display: "inline-flex", alignSelf: "flex-start" }}>
            {CONTINENTS.map((c) => (
              <button
                key={c}
                onClick={() => setContinent(c)}
                className={`hx-tab ${continent === c ? "hx-tab-active" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="hx-glass"
                style={{ height: 300, opacity: 0.3 }}
              />
            ))}
          </div>
        ) : destinations.length === 0 ? (
          <div
            className="hx-text-tertiary"
            style={{ textAlign: "center", padding: "80px 0" }}
          >
            No destinations found.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {destinations.map((d) => (
              <DestinationCard key={d.id} destination={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
