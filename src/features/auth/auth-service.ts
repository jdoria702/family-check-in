import { supabase } from "@/lib/supabase/server";
import type { RegisterInput } from "./auth-schema";

/*
    This function is responsible for registering a new user.
    Accepts validated input from the RegisterInput schema and returns a RegisterResult object.
*/

export type RegisterResult = {
    userId: string;
    email: string | null;
    requiresEmailConfirmation: boolean;
};

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
    const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
            data: {
                name: input.name,
            }
        }
    });

    if (error) {
        console.log("Supabase error:", error);
        throw error;
    }

    if (!data.user) {
        throw new Error("User registration failed: No user data returned");
    }

    return {
        userId: data.user.id,
        email: data.user.email ?? null,
        requiresEmailConfirmation: !data.user.confirmed_at,
    };
}