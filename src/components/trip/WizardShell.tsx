"use client";

import { useReducer, useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import type { TripData, TripRow } from "@/types/trip";
import type { CreateTripRequest } from "@/types/trip";
import { emptyTripData } from "@/types/trip";
import UnifiedTrip from "./UnifiedTrip";

interface WizardState {
  tripData: TripData;
}

type WizardAction = { type: "UPDATE_DATA"; data: TripData };

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "UPDATE_DATA":
      return { ...state, tripData: action.data };
    default:
      return state;
  }
}

function mapTripDataToRequest(data: TripData, userId: string): CreateTripRequest {
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

/** Convert a TripRow from the API back into the form-friendly TripData shape */
function mapTripRowToData(row: TripRow): TripData {
  return {
    ...emptyTripData,
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

interface WizardShellProps {
  editTripId?: string;
  collectField?: string;
}

export default function WizardShell({ editTripId, collectField }: WizardShellProps) {
  const router = useRouter();
  const session = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [, setSubmitError] = useState("");
  const [state, dispatch] = useReducer(reducer, {
    tripData: { ...emptyTripData, how_we_are_travelling: "Flying" },
  });

  const { tripData } = state;

  // Load existing trip data when editing
  useEffect(() => {
    if (!editTripId) return;

    fetch(`/api/trips/${editTripId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.trip) {
          dispatch({ type: "UPDATE_DATA", data: mapTripRowToData(data.trip) });
        }
      })
      .catch(() => {});
  }, [editTripId]);

  const onUpdate = useCallback(
    (data: TripData) => dispatch({ type: "UPDATE_DATA", data }),
    []
  );

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitError("");

    sessionStorage.setItem("heha-trip-data", JSON.stringify(tripData));

    if (!session.userId) {
      router.push("/trip/generated");
      return;
    }

    setSubmitting(true);
    try {
      const payload = mapTripDataToRequest(tripData, session.userId);
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.trip?.id) {
        router.push(`/trip/${data.trip.id}`);
        return;
      }

      console.error("POST /api/trips failed:", data);
      setSubmitError(data.error || `Save failed (${res.status})`);
      router.push("/trip/generated");
    } catch (err) {
      console.error("Trip submit error:", err);
      router.push("/trip/generated");
    } finally {
      setSubmitting(false);
    }
  }, [tripData, router, session.userId, submitting]);

  // Build an initial system-style message to focus collection if editing
  const collectMessage = editTripId && collectField
    ? `I'd like to update my ${collectField.replace(/_/g, " ")} for this trip.`
    : undefined;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 flex-1 flex flex-col">
      <UnifiedTrip
        tripData={tripData}
        onTripDataChange={onUpdate}
        onComplete={handleSubmit}
        userId={session.userId}
        initialMessage={collectMessage}
      />
    </div>
  );
}
