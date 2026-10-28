import { z } from "zod";

export const deleteAccountSchema = z.object({
  confirmUsername: z.string().min(1).max(200),
  password: z.string().min(1).max(200).optional(),
});
