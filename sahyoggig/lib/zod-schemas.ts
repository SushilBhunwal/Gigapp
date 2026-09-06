import { z } from "zod";

// ─── Auth ──────────────────────────────────────────────────────────────────

export const SignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["CUSTOMER", "WORKER"]),
  // Required if role === WORKER
  cooperativeId: z.string().optional(),
  serviceCategoryId: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Bookings ──────────────────────────────────────────────────────────────

export const CreateBookingSchema = z.object({
  workerId: z.string().min(1, "Invalid worker ID"),
  scheduledAt: z.string().datetime("Invalid date/time"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  amount: z.number().positive("Amount must be positive"),
});

export const UpdateBookingStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

// ─── Reviews ───────────────────────────────────────────────────────────────

export const CreateReviewSchema = z.object({
  bookingId: z.string().min(1, "Invalid booking ID"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// ─── Workers ───────────────────────────────────────────────────────────────

export const VerifyWorkerSchema = z.object({
  isVerified: z.boolean(),
});

export const ToggleAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export const WorkerQuerySchema = z.object({
  categoryId: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

// ─── Cooperatives ─────────────────────────────────────────────────────────

export const UpdateCommissionSchema = z.object({
  commissionPct: z.number().min(0).max(100),
});

// ─── Payments ─────────────────────────────────────────────────────────────

export const MockPaymentSchema = z.object({
  bookingId: z.string().cuid("Invalid booking ID"),
});

// ─── Types ────────────────────────────────────────────────────────────────

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type VerifyWorkerInput = z.infer<typeof VerifyWorkerSchema>;
export type ToggleAvailabilityInput = z.infer<typeof ToggleAvailabilitySchema>;
export type UpdateCommissionInput = z.infer<typeof UpdateCommissionSchema>;
export type MockPaymentInput = z.infer<typeof MockPaymentSchema>;
