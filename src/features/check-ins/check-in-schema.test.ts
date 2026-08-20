import { describe, expect, it } from "vitest";
import { createCheckInSchema } from "./check-in-schema";

describe("createCheckInSchema", () => {
    it("accepts a valid check-in", () => {
        const result = createCheckInSchema.safeParse({
            generalFeeling: 4,
            notes: "Feeling good today",
        });

        expect(result.success).toBe(true);
    });

    it("accepts a check-in without notes", () => {
        const result = createCheckInSchema.safeParse({
            generalFeeling: 3,
        });

        expect(result.success).toBe(true);
    });

    it.each([1, 5])("accepts the boundary general feeling value %i", (generalFeeling) => {
        const result = createCheckInSchema.safeParse({
            generalFeeling,
        })

        expect(result.success).toBe(true)
    })

    it("rejects a general feeling below 1", () => {
        const result = createCheckInSchema.safeParse({
            generalFeeling: 0,
        });

        expect(result.success).toBe(false);

        if (!result.success) {
            expect(result.error.issues[0].message).toBe(
                "General feeling must be between 1 and 5",
            )

            expect(result.error.issues[0].path).toEqual([
                "generalFeeling",
            ])
        };
    });

    it("rejects a general feeling above 5", () => {
        const result = createCheckInSchema.safeParse({
            generalFeeling: 6,
        });

        expect(result.success).toBe(false);

        if (!result.success) {
            expect(result.error.issues[0].message).toBe(
                "General feeling must be between 1 and 5",
            )

            expect(result.error.issues[0].path).toEqual([
                "generalFeeling",
            ])
        };
    });

    it("rejects a non-integer general feeling", () => {
        const result = createCheckInSchema.safeParse({
            generalFeeling: 3.5,
        });

        expect(result.success).toBe(false);
    });

    it("rejects notes longer than 300 characters", () => {
        const result = createCheckInSchema.safeParse({
            generalFeeling: 4,
            notes: "a".repeat(301),
        });

        expect(result.success).toBe(false);
    });

    it("trims whitespace from notes", () => {
        const result = createCheckInSchema.safeParse({
            generalFeeling: 4,
            notes: "  Feeling good today  ",
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.notes).toBe("Feeling good today");
        }
    });
});