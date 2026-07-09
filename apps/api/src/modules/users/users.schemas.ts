import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phoneNumber: z.string().optional().nullable(),
  crmCustomerId: z.string().optional().nullable(),
  teamIds: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
  phoneNumber: z.string().optional().nullable(),
  crmCustomerId: z.string().optional().nullable(),
  teamIds: z.array(z.string()).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
