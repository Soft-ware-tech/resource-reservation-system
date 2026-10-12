import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email().trim().max(254),
  password: z.string().min(1).max(128),
});
