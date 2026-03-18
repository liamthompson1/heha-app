import { z } from "zod";

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only");

export const upsertPageSchema = z.object({
  key: slugSchema,
  content: z.string().min(1, "Content is required"),
  categories: z.array(z.string()).default([]),
});

export const hxProductTypeSchema = z.enum([
  "airport_parking",
  "airport_hotel",
  "airport_lounge",
  "car_hire",
  "travel_insurance",
  "airport_transfer",
  "holiday_extras_bundle",
]);

export type UpsertPageInput = z.infer<typeof upsertPageSchema>;
