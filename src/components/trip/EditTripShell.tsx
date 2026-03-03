"use client";

import { useReducer, useCallback, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import type { TripData, TripRow } from "@/types/trip";
import type { CreateTripRequest } from "@/types/trip";
import { emptyTripData } from "@/types/trip";
import UnifiedTrip from "./UnifiedTrip";

interface EditTripState {
  tripData: TripData;
}

type EditTripAction = { type: "UPDATE_DATA"; data: TripData };

function reducer(state: EditTripState, action: EditTripAction): EditTripState {
  switch (action.type) {
    case "UPDATE_DATA":
      return { ...state, tripData: action.data };
    default:
      return state;
  }
}

function mapTripDataToRequest(data: TripData, userId: string): Omit<CreateTripRequest, "user_id"> & { user_id: string } {
  const activePrefs: string[] = [];
  if (data.preferences.travel_insurance) activePrefs.push("Travel Insurance");
  if (data.preferences.airport_parking) activePrefs.push("Airport Parking");
  if (data.preferences.airport_lounge) activePrefs.push("Airport Lounge");
  if (data.preferences.car_hire) activePrefs.push("Car Hire");
  if (data.preferences.airport_transfers) activePrefs.push("Airport Transfers");
  if (data.preferences.extra_luggage) activePrefs.push("Extra Luggage");

  return {
    user_id: userId,
    trip: {
      destination: data.journey_locations.travelling_to,
      start_date: data.dates.start_date,
      end_date: data.dates.end_date,
      trip_type: data.reason || undefined,
    },
    people_travelling: data.people_travelling.map((p) => ({
      name: [p.first_name, p.last_name].filter(Boolean).join(" "),
      age: p.dob ? Math.floor((Date.now() - new Date(p.dob).getTime()) / 31557600000) : undefined,
    })),
    preferences: {
      activities: activePrefs.length > 0 ? activePrefs : undefined,
      budget: data.preferences.notes || undefined,
    },
    flights_if_known: data.flights_if_known.map((f) => ({
      airline: f.airline || undefined,
      flight_number: f.flight_number || undefined,
      departure_airport: f.from_airport,
      arrival_airport: f.to_airport,
      departure_time: [f.departure_date, f.departure_time].filter(Boolean).join(" ") || undefined,
      arrival_time: [f.arrival_date, f.arrival_time].filter(Boolean).join(" ") || undefined,
    })),
    journey_locations: {
      origin: data.journey_locations.travelling_from || undefined,
      stops: data.journey_locations.travelling_to ? [data.journey_locations.travelling_to] : undefined,
    },
    anything_else_we_should_know: data.anything_else_we_should_know || undefined,
  };
}

function mapTripRowToData(row: TripRow): TripData {
  return {
    ...emptyTripData,
    name: "",
    reason: row.trip.trip_type || "",
    how_we_are_travelling: "Flying",
    dates: {
      start_date: row.trip.start_date || "",
      end_date: row.trip.end_date || "",
      flexible_dates_notes: "",
    },
    journey_locations: {
      ...emptyTripData.journey_locations,
      travelling_to: row.trip.destination || "",
      travelling_from: row.journey_locations?.origin || "",
    },
    people_travelling: (row.people_travelling || []).map((p) => ({
      first_name: p.name.split(" ")[0] || "",
      last_name: p.name.split(" ").slice(1).join(" ") || "",
      dob: "",
      gender: "",
      email: "",
      phone: "",
    })),
    flights_if_known: (row.flights_if_known || []).map((f) => ({
      airline: f.airline || "",
      flight_number: f.flight_number || "",
      departure_date: f.departure_time?.split(" ")[0] || "",
      departure_time: f.departure_time?.split(" ")[1] || "",
      arrival_date: f.arrival_time?.split(" ")[0] || "",
      arrival_time: f.arrival_time?.split(" ")[1] || "",
      from_airport: f.departure_airport || "",
      to_airport: f.arrival_airport || "",
      direction: "outbound" as const,
    })),
    anything_else_we_should_know: row.anything_else_we_should_know || "",
  };
}

interface EditTripShellProps {
  tripId: string;
  collectField?: string;
}

export default function EditTripShell({ tripId, collectField }: EditTripShellProps) {
  const router = useRouter();
  const session = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [tripLoaded, setTripLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [, setSubmitError] = useState("");
  const [state, dispatch] = useReducer(reducer, {
    tripData: { ...emptyTripData, how_we_are_travelling: "Flying" },
  });
  const loadedRef = useRef(false);

  const { tripData } = state;

  // Load existing trip data
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    fetch(`/api/trips/${tripId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.trip) {
          dispatch({ type: "UPDATE_DATA", data: mapTripRowToData(data.trip) });
          setTripLoaded(true);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => setLoadError(true));
  }, [tripId]);

  const onUpdate = useCallback(
    (data: TripData) => dispatch({ type: "UPDATE_DATA", data }),
    []
  );

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitError("");

    if (!session.userId) {
      router.push(`/trip/${tripId}`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = mapTripDataToRequest(tripData, session.userId);
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push(`/trip/${tripId}`);
        return;
      }

      const data = await res.json();
      console.error("PUT /api/trips failed:", data);
      setSubmitError(data.error || `Save failed (${res.status})`);
    } catch (err) {
      console.error("Trip update error:", err);
    } finally {
      setSubmitting(false);
    }
  }, [tripData, router, session.userId, submitting, tripId]);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-lg mb-6" style={{ color: "var(--text-secondary)" }}>
          Couldn&rsquo;t load this trip.
        </p>
      </div>
    );
  }

  if (!tripLoaded) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 flex-1 flex flex-col pt-8">
        <div className="animate-pulse space-y-4 w-full">
          {/* Agent message bubble skeleton */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="glass-panel rounded-2xl p-4 flex-1 space-y-2" style={{ maxWidth: "80%" }}>
              <div className="glass-panel rounded-lg h-3 w-full" />
              <div className="glass-panel rounded-lg h-3 w-3/4" />
            </div>
          </div>
          {/* Suggestion chips skeleton */}
          <div className="flex gap-2 pl-11">
            <div className="glass-panel rounded-full h-9 w-24" />
            <div className="glass-panel rounded-full h-9 w-20" />
            <div className="glass-panel rounded-full h-9 w-28" />
          </div>
        </div>
      </div>
    );
  }

  const greeting = collectField
    ? `I'd like to update the ${collectField.replace(/_/g, " ")} for this trip.`
    : undefined;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 flex-1 flex flex-col">
      <UnifiedTrip
        tripData={tripData}
        onTripDataChange={onUpdate}
        onComplete={handleSubmit}
        userId={session.userId}
        initialMessage={greeting}
        editMode
        editTripId={tripId}
        collectField={collectField}
      />
    </div>
  );
}
