import { supabase } from "@/lib/supabase/browser";
import { SupabaseClient } from "@supabase/supabase-js";
import type { RegisterInput, SignInInput } from "./auth-schema";

/*
    Responsible for registering a new user.
    Accepts validated input from the RegisterInput schema and returns a RegisterResult object.

    Responsible for signing in an existing user.
    Accepts validated input from the SignInInput schema and returns a SignInResult object.
*/

type RegisterResult = {
    userId: string;
    email: string | null;
    requiresEmailConfirmation: boolean;
};

type SignInResult = {
    userId: string;
    email: string;
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

export async function signInUser(supabase: SupabaseClient, input: SignInInput): Promise<SignInResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
    });

    if (error) {
        throw error;
    }

    if (!data.user || !data.session) {
        throw new Error("User sign-in failed: No user or session data returned");
    }

    return {
        userId: data.user.id,
        email: data.user.email ?? input.email,
    }
}