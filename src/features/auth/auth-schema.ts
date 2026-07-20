import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .regex(/^[\p{L}\p{M}'-]+(?: [\p{L}\p{M}'-]+)*$/u, {
    message:
      "Name can only contain letters, single spaces, apostrophes, and hyphens",
  })
  .refine(
    (name) => name.replaceAll(" ", "").length >= 2,
    {
      message:
        "Name must contain at least 2 characters, excluding spaces",
    }
  );

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({
    message: "Invalid email address",
  });

const registrationPasswordSchema = z
  .string()
  .min(8, {
    message: "Password must be at least 8 characters long",
  })
  .regex(/[A-Z]/, {
    message:
      "Password must contain at least one uppercase letter",
  })
  .regex(/[a-z]/, {
    message:
      "Password must contain at least one lowercase letter",
  })
  .regex(/[^A-Za-z0-9]/, {
    message:
      "Password must contain at least one special character",
  });

const signInPasswordSchema = z
  .string()
  .min(1, {
    message: "Password is required",
  });

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: registrationPasswordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: signInPasswordSchema,
});

export type RegisterInput =
  z.infer<typeof registerSchema>;

export type SignInInput =
  z.infer<typeof signInSchema>;