 // Adjust import path as needed
import { z } from 'zod';

// Input validation schema
export const createAssignmentSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim(),
  description: z.string()
    .min(1, "Description is required")
    .max(5000, "Description must be less than 5000 characters")
    .trim(),
  deadline: z.string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((date) => date > new Date(), {
      message: "Deadline must be in the future"
    }),
  instructorId: z.string()
    .uuid("Invalid instructor ID format")
});

