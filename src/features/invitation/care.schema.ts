import { z } from "zod";

export const invitationCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .toLowerCase()
    .length(8, "Invitation code must be 8 characters")
    .regex(/^[a-f0-9]{8}$/, "Invitation code is invalid"),
});

export type InvitationCodeInput =
  z.infer<typeof invitationCodeSchema>;