import { z } from "zod";

const tripDetailsSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  trip_type: z.string().optional(),
});

const personSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().int().positive().optional(),
  dietary_requirements: z.array(z.string()).optional(),
});

const preferencesSchema = z.object({
  budget: z.string().optional(),
  accommodation_type: z.string().optional(),
  activities: z.array(z.string()).optional(),
  pace: z.string().optional(),
});

const flightSchema = z.object({
  airline: z.string().optional(),
  flight_number: z.string().optional(),
  departure_airport: z.string().min(1, "Departure airport is required"),
  arrival_airport: z.string().min(1, "Arrival airport is required"),
  departure_time: z.string().optional(),
  arrival_time: z.string().optional(),
  flight_reference: z.string().optional(),
});

const journeyLocationsSchema = z.object({
  origin: z.string().optional(),
  stops: z.array(z.string()).optional(),
});

export const createTripSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  trip: tripDetailsSchema,
  people_travelling: z
    .array(personSchema)
    .min(1, "At least one person must be travelling"),
  preferences: preferencesSchema,
  flights_if_known: z.array(flightSchema).optional().default([]),
  journey_locations: z.object({
    origin: z.string().optional(),
    stops: z.array(z.string()).optional(),
  }).optional().default({}),
  anything_else_we_should_know: z.string().optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
