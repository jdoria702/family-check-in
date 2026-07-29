import { z } from "zod";

export const createCheckInSchema = z.object({
    generalFeeling: z
        .number()
        .int()
        .min(1, "General feeling must be between 1 and 5")
        .max(5, "General feeling must be between 1 and 5"),

    notes: z
        .string()
        .trim()
        .max(300, "Notes cannot exceed 300 characters")
        .nullable()
        .optional(),
});

export type CreateCheckInInput = z.infer<
    typeof createCheckInSchema
>;