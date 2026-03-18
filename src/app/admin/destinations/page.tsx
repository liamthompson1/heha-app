"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { fetchDestinations } from "@/lib/api/destinations";
import type { Destination } from "@/types/destination";

const STATUS_BADGE: Record<string, string> = {
  published: "hx-badge-green",
  draft: "hx-badge-orange",
  pending_review: "hx-badge-red",
};

const STATUS_LABEL: Record<string, string> = {
  published: "Published",
  draft: "Draft",
  pending_review: "Pending",
};

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDestinations().then((d) => {
      setDestinations(d);
      setLoading(false);
    });
  }, []);

  return (
    <AdminShell>
      <div style={{ marginBottom: 40 }}>
        <p className="hx-eyebrow" style={{ marginBottom: 8 }}>
          Content
        </p>
        <h1 className="hx-heading" style={{ fontSize: 48 }}>
          Destinations
        </h1>
        <p className="hx-text-secondary" style={{ fontSize: 16, marginTop: 8 }}>
          {destinations.length} destination{destinations.length !== 1 && "s"} managed by your bots.
        </p>
      </div>

      <div className="hx-glass hx-table-wrap" style={{ padding: 0 }}>
        <table className="hx-table">
          <thead>
            <tr>
              <th>Destination</th>
              <th>Continent</th>
              <th>Status</th>
              <th>Updated By</th>
              <th style={{ textAlign: "right" }}>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="hx-text-tertiary"
                  style={{ textAlign: "center", padding: "32px 16px" }}
                >
                  Loading...
                </td>
              </tr>
            ) : destinations.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="hx-text-tertiary"
                  style={{ textAlign: "center", padding: "32px 16px" }}
                >
                  No destinations yet.
                </td>
              </tr>
            ) : (
              destinations.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link
                      href={`/admin/destinations/${d.slug}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        textDecoration: "none",
                      }}
                    >
                      {d.hero_image_url ? (
                        <img
                          src={d.hero_image_url}
                          alt={d.name}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: "rgba(255,255,255,0.04)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                          }}
                        >
                          🌍
                        </div>
                      )}
                      <div>
                        <div
                          className="hx-text-primary"
                          style={{ fontSize: 14, fontWeight: 500 }}
                        >
                          {d.name}
                        </div>
                        <div className="hx-text-tertiary" style={{ fontSize: 12 }}>
                          {d.country}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td>{d.continent}</td>
                  <td>
                    <span className={`hx-badge ${STATUS_BADGE[d.status]}`}>
                      {STATUS_LABEL[d.status]}
                    </span>
                  </td>
                  <td className="hx-text-secondary" style={{ fontSize: 13 }}>
                    {d.updated_by_name || "—"}
                  </td>
                  <td
                    className="hx-text-tertiary"
                    style={{ textAlign: "right", fontSize: 12 }}
                  >
                    {new Date(d.updated_at).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
