"use client";

import { useEffect, useState } from "react";
import { parseBookingsMarkdown, type ParsedBooking } from "@/lib/bookings-parser";

const PRODUCT_ICONS: Record<string, string> = {
  "Airport Parking": "🅿️",
  "Insurance": "🛡️",
  "Hotel": "🏨",
  "Lounge": "✈️",
  "Car Hire": "🚗",
  "Transfer": "🚐",
  "Airport Hotel": "🏨",
  "Fast Track": "⚡",
};

function getIcon(productType: string): string {
  for (const [key, icon] of Object.entries(PRODUCT_ICONS)) {
    if (productType.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return "📦";
}

interface BookingsWidgetProps {
  tripId: string;
}

export default function BookingsWidget({ tripId }: BookingsWidgetProps) {
  const [bookings, setBookings] = useState<ParsedBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/stories?path=json&format=markdown`);
        if (!res.ok) return;
        const envelope = await res.json();
        const md = envelope.text ?? "";
        const parsed = parseBookingsMarkdown(md);
        setBookings(parsed);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId]);

  if (loading) {
    return (
      <div className="widget-section animate-pulse">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-6 h-6 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="glass-panel rounded-xl h-6 w-28" />
        </div>
        <div className="glass-panel rounded-2xl h-24" />
      </div>
    );
  }

  if (bookings.length === 0) return null;

  return (
    <div className="widget-section">
      <div className="widget-header">
        <span style={{ fontSize: "1.25rem" }}>🧾</span>
        <h2 className="widget-title">Your Bookings</h2>
        <span
          className="text-xs"
          style={{
            color: "var(--text-tertiary)",
            marginLeft: "auto",
            fontWeight: 500,
          }}
        >
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {bookings.map((booking) => (
          <div key={booking.bookingRef} className="glass-panel booking-card">
            <div className="booking-card-header">
              <span className="booking-card-icon">{getIcon(booking.productType)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="booking-card-title">{booking.productType}</div>
                <div className="booking-card-ref">Ref: {booking.bookingRef}</div>
              </div>
              <span
                className={`booking-status-badge ${
                  booking.status === "active"
                    ? "booking-status-active"
                    : booking.status === "cancelled"
                      ? "booking-status-cancelled"
                      : ""
                }`}
              >
                {booking.status === "active" ? "Active" : booking.status === "cancelled" ? "Cancelled" : "Unknown"}
              </span>
            </div>

            {Object.keys(booking.fields).length > 0 && (
              <div className="booking-card-fields">
                {Object.entries(booking.fields).map(([key, value]) => (
                  <div key={key} className="booking-field">
                    <span className="booking-field-label">{key}</span>
                    <span className="booking-field-value">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {booking.links.length > 0 && (
              <div className="booking-card-actions">
                {booking.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="booking-action-link"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
