import { z } from "zod";

export const createCheckInSchema = z.object({
    generalFeeling: z
        .number()
        .int()
        .min(1)
        .max(5),

    notes: z
        .string()
        .trim()
        .max(300)
        .optional()
})

export type CreateCheckInInput =
    z.infer<typeof createCheckInSchema>;

export type CreateCheckInServiceInput =
    CreateCheckInInput & {
        memberId: string;
    };