import type Anthropic from "@anthropic-ai/sdk";

export const agentTools: Anthropic.Tool[] = [
  {
    name: "update_trip_data",
    description:
      "Update one or more fields on the trip planning form. Call this whenever the user provides trip details (destination, dates, travelers, preferences, etc.). You can update any combination of fields in a single call. Nested objects are deep-merged with existing data.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "A friendly name for the trip (e.g. 'Barcelona Family Holiday')",
        },
        reason: {
          type: "string",
          description: "Trip type: holiday, business, honeymoon, family, adventure, etc.",
        },
        how_we_are_travelling: {
          type: "string",
          description: "Travel mode: flying, driving, train, cruise, mix, etc.",
        },
        dates: {
          type: "object",
          properties: {
            start_date: { type: "string", description: "ISO date YYYY-MM-DD" },
            end_date: { type: "string", description: "ISO date YYYY-MM-DD" },
            flexible_dates_notes: { type: "string" },
          },
        },
        people_travelling: {
          type: "array",
          description:
            "Full list of travelers. Replaces existing array — include all known travelers each time.",
          items: {
            type: "object",
            properties: {
              first_name: { type: "string" },
              last_name: { type: "string" },
              dob: { type: "string", description: "Date of birth YYYY-MM-DD if known" },
              gender: { type: "string" },
              email: { type: "string" },
              phone: { type: "string" },
            },
            required: ["first_name"],
          },
        },
        journey_locations: {
          type: "object",
          properties: {
            travelling_from: { type: "string" },
            postcode_from: { type: "string" },
            travelling_to: { type: "string" },
            postcode_to: { type: "string" },
            nearest_airport: { type: "string" },
          },
        },
        flights_if_known: {
          type: "array",
          items: {
            type: "object",
            properties: {
              airline: { type: "string" },
              flight_number: { type: "string" },
              departure_date: { type: "string" },
              departure_time: { type: "string" },
              arrival_date: { type: "string" },
              arrival_time: { type: "string" },
              from_airport: { type: "string" },
              to_airport: { type: "string" },
              direction: { type: "string", enum: ["outbound", "return"] },
            },
          },
        },
        preferences: {
          type: "object",
          properties: {
            travel_insurance: { type: "boolean" },
            airport_parking: { type: "boolean" },
            airport_lounge: { type: "boolean" },
            car_hire: { type: "boolean" },
            airport_transfers: { type: "boolean" },
            extra_luggage: { type: "boolean" },
            notes: { type: "string" },
          },
        },
        anything_else_we_should_know: { type: "string" },
      },
    },
  },
  {
    name: "save_memory",
    description:
      "Save a personal preference or fact about the user for future trips. Call this when the user mentions a lasting preference (e.g. 'I always prefer window seats', 'I'm vegetarian', 'my wife is allergic to nuts'). Do NOT save trip-specific info here — only reusable preferences.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          enum: [
            "dietary",
            "seating",
            "accommodation",
            "health",
            "travel_style",
            "budget",
            "activities",
            "general",
          ],
          description: "Category for the preference",
        },
        content: {
          type: "string",
          description: "The preference or fact to remember",
        },
        person_name: {
          type: "string",
          description: "Name of the person this applies to, if not the main user",
        },
      },
      required: ["category", "content"],
    },
  },
  {
    name: "search_flights",
    description:
      "Search for real available flights between two airports on a given date. Use this when the user is flying and you have departure airport IATA code, arrival airport IATA code, and a departure date. Returns a list of available flights. Present the top options to the user so they can choose. After they choose, use update_trip_data to save the selected flight(s).",
    input_schema: {
      type: "object" as const,
      properties: {
        origin: {
          type: "string",
          description: "Departure airport IATA code (e.g. LGW, MAN, STN)",
        },
        destination: {
          type: "string",
          description: "Arrival airport IATA code (e.g. BCN, FAO, PMI)",
        },
        departure_date: {
          type: "string",
          description: "Departure date in YYYY-MM-DD format",
        },
        return_date: {
          type: "string",
          description: "Return date in YYYY-MM-DD format (optional — for return flights)",
        },
      },
      required: ["origin", "destination", "departure_date"],
    },
  },
  {
    name: "mark_form_complete",
    description:
      "Signal that enough trip information has been collected and the user can proceed to plan their trip. Call this only when all required fields are filled: reason, name, travel mode, start date, end date, at least one traveler, travelling from, and travelling to.",
    input_schema: {
      type: "object" as const,
      properties: {
        summary: {
          type: "string",
          description: "A brief summary of the trip for the user to confirm",
        },
      },
      required: ["summary"],
    },
  },
];
