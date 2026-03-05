"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import GlassInput from "@/components/GlassInput";
import GlassTextarea from "@/components/GlassTextarea";
import GlassButton from "@/components/GlassButton";

export default function NewDestinationPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    city: "",
    country: "",
    latitude: "",
    longitude: "",
    currency_code: "",
    currency_name: "",
    primary_language: "",
    description: "",
    flag_url: "",
    timezone: "",
    driving_side: "",
    calling_code: "",
    population: "",
    region: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create destination");
        return;
      }

      router.push("/admin/destinations");
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="gradient-text-subtle text-2xl font-semibold">
        New Destination
      </h1>

      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GlassInput
              label="City *"
              placeholder="Paris"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
            />
            <GlassInput
              label="Country *"
              placeholder="France"
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GlassInput
              label="Latitude"
              type="number"
              placeholder="48.8566"
              value={form.latitude}
              onChange={(e) => update("latitude", e.target.value)}
            />
            <GlassInput
              label="Longitude"
              type="number"
              placeholder="2.3522"
              value={form.longitude}
              onChange={(e) => update("longitude", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GlassInput
              label="Currency Code"
              placeholder="EUR"
              value={form.currency_code}
              onChange={(e) => update("currency_code", e.target.value)}
            />
            <GlassInput
              label="Currency Name"
              placeholder="Euro"
              value={form.currency_name}
              onChange={(e) => update("currency_name", e.target.value)}
            />
          </div>

          <GlassInput
            label="Primary Language"
            placeholder="French"
            value={form.primary_language}
            onChange={(e) => update("primary_language", e.target.value)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GlassInput
              label="Timezone"
              placeholder="UTC+01:00"
              value={form.timezone}
              onChange={(e) => update("timezone", e.target.value)}
            />
            <GlassInput
              label="Calling Code"
              placeholder="+33"
              value={form.calling_code}
              onChange={(e) => update("calling_code", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GlassInput
              label="Driving Side"
              placeholder="right"
              value={form.driving_side}
              onChange={(e) => update("driving_side", e.target.value)}
            />
            <GlassInput
              label="Population"
              type="number"
              placeholder="67390000"
              value={form.population}
              onChange={(e) => update("population", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GlassInput
              label="Region"
              placeholder="Western Europe"
              value={form.region}
              onChange={(e) => update("region", e.target.value)}
            />
            <GlassInput
              label="Flag URL"
              placeholder="https://flagcdn.com/fr.svg"
              value={form.flag_url}
              onChange={(e) => update("flag_url", e.target.value)}
            />
          </div>

          <GlassTextarea
            label="Description"
            placeholder="Brief description of the destination..."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <GlassButton type="submit" variant="coral" disabled={saving}>
              {saving ? "Creating..." : "Create Destination"}
            </GlassButton>
            <GlassButton href="/admin/destinations">Cancel</GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
