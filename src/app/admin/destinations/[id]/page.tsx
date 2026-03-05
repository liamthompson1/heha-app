"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import GlassInput from "@/components/GlassInput";
import GlassTextarea from "@/components/GlassTextarea";
import GlassButton from "@/components/GlassButton";
import type { Destination } from "@/types/reference-data";

export default function EditDestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/destinations/${id}`);
        if (!res.ok) {
          setError("Destination not found");
          return;
        }
        const data: Destination = await res.json();
        setForm({
          city: data.city,
          country: data.country,
          latitude: data.latitude?.toString() || "",
          longitude: data.longitude?.toString() || "",
          currency_code: data.currency_code || "",
          currency_name: data.currency_name || "",
          primary_language: data.primary_language || "",
          description: data.description || "",
          flag_url: data.flag_url || "",
          timezone: data.timezone || "",
          driving_side: data.driving_side || "",
          calling_code: data.calling_code || "",
          population: data.population?.toString() || "",
          region: data.region || "",
        });
      } catch {
        setError("Failed to load destination");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/destinations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update destination");
        return;
      }

      router.push("/admin/destinations");
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-center text-white/40">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="gradient-text-subtle text-2xl font-semibold">
        Edit Destination
      </h1>

      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GlassInput
              label="City *"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
            />
            <GlassInput
              label="Country *"
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GlassInput
              label="Latitude"
              type="number"
              value={form.latitude}
              onChange={(e) => update("latitude", e.target.value)}
            />
            <GlassInput
              label="Longitude"
              type="number"
              value={form.longitude}
              onChange={(e) => update("longitude", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GlassInput
              label="Currency Code"
              value={form.currency_code}
              onChange={(e) => update("currency_code", e.target.value)}
            />
            <GlassInput
              label="Currency Name"
              value={form.currency_name}
              onChange={(e) => update("currency_name", e.target.value)}
            />
          </div>

          <GlassInput
            label="Primary Language"
            value={form.primary_language}
            onChange={(e) => update("primary_language", e.target.value)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GlassInput
              label="Timezone"
              value={form.timezone}
              onChange={(e) => update("timezone", e.target.value)}
            />
            <GlassInput
              label="Calling Code"
              value={form.calling_code}
              onChange={(e) => update("calling_code", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GlassInput
              label="Driving Side"
              value={form.driving_side}
              onChange={(e) => update("driving_side", e.target.value)}
            />
            <GlassInput
              label="Population"
              type="number"
              value={form.population}
              onChange={(e) => update("population", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GlassInput
              label="Region"
              value={form.region}
              onChange={(e) => update("region", e.target.value)}
            />
            <GlassInput
              label="Flag URL"
              value={form.flag_url}
              onChange={(e) => update("flag_url", e.target.value)}
            />
          </div>

          <GlassTextarea
            label="Description"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <GlassButton type="submit" variant="coral" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </GlassButton>
            <GlassButton href="/admin/destinations">Cancel</GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
