"use client";

import { useEffect, useState, useCallback } from "react";
import GlassInput from "@/components/GlassInput";
import GlassButton from "@/components/GlassButton";
import DataTable, { type Column } from "@/components/admin/DataTable";
import EnrichButton from "@/components/admin/EnrichButton";
import type { Destination } from "@/types/reference-data";

const columns: Column<Destination>[] = [
  {
    key: "city",
    label: "City",
    render: (row) => (
      <span className="flex items-center gap-1.5">
        {row.flag_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.flag_url} alt="" className="h-3 w-4 rounded-sm object-cover" />
        )}
        {row.city}
      </span>
    ),
  },
  { key: "country", label: "Country" },
  { key: "currency_code", label: "Currency" },
  { key: "primary_language", label: "Language" },
  { key: "timezone", label: "Timezone" },
  { key: "calling_code", label: "Dial" },
  {
    key: "source",
    label: "Source",
    render: (row) => (
      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50">
        {row.source}
      </span>
    ),
  },
];

export default function DestinationsListPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDestinations = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/destinations${params}`);
      const data = await res.json();
      if (Array.isArray(data)) setDestinations(data);
    } catch (err) {
      console.error("Failed to load destinations:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadDestinations();
  }, [loadDestinations]);

  async function handleDelete(dest: Destination) {
    if (!confirm(`Delete ${dest.city}, ${dest.country}?`)) return;
    await fetch(`/api/destinations/${dest.id}`, { method: "DELETE" });
    loadDestinations();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="gradient-text-subtle text-2xl font-semibold">
          Destinations
        </h1>
        <div className="flex gap-2">
          <EnrichButton
            entityType="destination"
            placeholder="City, Country (e.g. Paris, France)"
          />
          <GlassButton href="/admin/destinations/new" variant="coral">
            + New Destination
          </GlassButton>
        </div>
      </div>

      <GlassInput
        label="Search"
        placeholder="Search by city or country..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="text-center text-white/40">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          rows={destinations}
          editPath={(row) => `/admin/destinations/${row.id}`}
          onDelete={handleDelete}
          emptyMessage="No destinations found. Add one or fetch from API."
        />
      )}
    </div>
  );
}
