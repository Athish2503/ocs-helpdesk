import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string({ error: "Team name is required" }).trim().min(2).max(100),
  description: z.string().trim().optional(),
  memberIds: z.array(z.string()).optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().optional(),
  memberIds: z.array(z.string()).optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
