import { z } from "zod";

const travelAdvisorySchema = z.object({
  level: z.string(),
  description: z.string(),
  source: z.string(),
  updated_at: z.string(),
});

export const createDestinationSchema = z.object({
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  latitude: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  longitude: z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
  currency_code: z.string().max(3).optional().or(z.literal("")),
  currency_name: z.string().optional().or(z.literal("")),
  primary_language: z.string().optional().or(z.literal("")),
  languages: z.array(z.string()).optional().default([]),
  travel_advisories: z.array(travelAdvisorySchema).optional().default([]),
  popular_seasons: z.array(z.string()).optional().default([]),
  description: z.string().optional().or(z.literal("")),
  flag_url: z.string().url().optional().or(z.literal("")).or(z.null()),
  timezone: z.string().optional().or(z.literal("")),
  driving_side: z.string().optional().or(z.literal("")),
  calling_code: z.string().optional().or(z.literal("")),
  population: z.coerce.number().int().nonnegative().optional().or(z.literal("")),
  region: z.string().optional().or(z.literal("")),
  source: z.string().optional().default("manual"),
});

export const updateDestinationSchema = createDestinationSchema.partial();

export type CreateDestinationInput = z.infer<typeof createDestinationSchema>;
export type UpdateDestinationInput = z.infer<typeof updateDestinationSchema>;
