"use client";

import { useEffect, useState } from "react";
import { parseBookingsMarkdown } from "@/lib/bookings-parser";
import SinglePerilGrid from "./SinglePerilGrid";

interface TripSpecificPerilsProps {
  tripId: string;
}

export default function TripSpecificPerils({ tripId }: TripSpecificPerilsProps) {
  const [bookingTypes, setBookingTypes] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/stories?path=json&format=markdown`);
        if (!res.ok) return;
        const envelope = await res.json();
        const md = envelope.text ?? "";
        const bookings = parseBookingsMarkdown(md);
        setBookingTypes(bookings.map((b) => b.productType));
      } catch { /* silent */ } finally {
        setLoaded(true);
      }
    })();
  }, [tripId]);

  if (!loaded || bookingTypes.length === 0) return null;

  return (
    <div className="widget-section">
      <div className="widget-header">
        <span style={{ fontSize: "1.25rem" }}>🛡️</span>
        <h2 className="widget-title">Recommended Protection</h2>
      </div>
      <SinglePerilGrid filter="trip-specific" bookingTypes={bookingTypes} />
    </div>
  );
}
