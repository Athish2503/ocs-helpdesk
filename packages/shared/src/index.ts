import { z } from 'zod';

// Helper for Enum mappings
export const UserRoleSchema = z.enum(['CUSTOMER', 'AGENT', 'SUPERVISOR', 'ADMIN']);
export const TicketStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED']);
export const TicketPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const KBStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

// --- Authentication Schemas ---

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: UserRoleSchema.optional().default('CUSTOMER'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const VerifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Verification code must be exactly 6 characters'),
});

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'New password must be at least 8 characters long'),
});

// --- Ticket Schemas ---

export const CreateTicketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  priority: TicketPrioritySchema.default('MEDIUM'),
  category: z.string().min(1, 'Category is required'),
});

export const UpdateTicketSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(10).optional(),
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  category: z.string().min(1).optional(),
  agentId: z.string().uuid().nullable().optional(),
});

export const AddMessageSchema = z.object({
  body: z.string().min(1, 'Message body cannot be empty'),
  isInternal: z.boolean().optional().default(false),
  attachments: z.array(z.string().uuid()).optional(),
});

// --- Knowledge Base Schemas ---

export const CreateArticleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long'),
  body: z.string().min(10, 'Body must be at least 10 characters long'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
  status: KBStatusSchema.default('DRAFT'),
});

export const UpdateArticleSchema = z.object({
  title: z.string().min(5).optional(),
  body: z.string().min(10).optional(),
  category: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  status: KBStatusSchema.optional(),
});

// --- Type inferences for shared schemas ---

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;
export type ResetPasswordRequestInput = z.infer<typeof ResetPasswordRequestSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;
export type AddMessageInput = z.infer<typeof AddMessageSchema>;

export type CreateArticleInput = z.infer<typeof CreateArticleSchema>;
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>;
