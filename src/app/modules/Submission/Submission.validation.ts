import { z } from "zod";

// Optional: Zod schema for validation
const createSubmissionSchema = z.object({
  assignmentId: z.string().uuid(),
  studentId: z.string().uuid(),
  submissionUrl: z.string().url(),
  note: z.string().optional(),
});

// Validation schema
const updateSubmissionSchema = z.object({
  submissionUrl: z.string().url().optional(),
  note: z.string().max(1000).optional(),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).optional(),
  feedback: z.string().max(2000).optional(),
});

const UpdateSubmissionStatusSchema = z.object({
  newStatus: z
    .string()
    .min(1, "Status cannot be empty")
    .max(100, "Status must be less than 100 characters")
    .trim(),
  feedback: z
    .string()
    .min(1, "Feedback cannot be empty")
    .max(2000, "Feedback must be less than 2000 characters")
    .trim()
    .optional(),
});

export const SubmissionValidation = {
  createSubmissionSchema,
  updateSubmissionSchema,
  UpdateSubmissionStatusSchema,
};
