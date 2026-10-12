import { z } from "zod";

const optionalText = z.string().trim().max(2000).optional().or(z.literal(""));

export const bookingSchema = z.object({
  resourceId: z.string().uuid("Choose a valid resource."),
  startAt: z.iso.datetime({ local: true }),
  endAt: z.iso.datetime({ local: true }),
  purpose: z.string().trim().max(500).optional().or(z.literal("")),
});

export const categorySchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2, "Category name must be at least 2 characters.").max(60),
  description: optionalText,
});

export const resourceSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2, "Resource name must be at least 2 characters.").max(100),
  categoryId: z.string().uuid("Choose a category."),
  description: optionalText,
  details: z.string().trim().max(300).optional().or(z.literal("")),
  imageUrl: z.union([z.literal(""), z.url({ protocol: /^https?$/ }).max(2048)]).optional(),
  active: z.enum(["true", "false"]).default("true"),
});
