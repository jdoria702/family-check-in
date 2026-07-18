import { createClient } from "@/lib/supabase/server"
import { signInSchema } from "@/features/auth/auth-schema";
import { signInUser } from "@/features/auth/auth-service";
import { AuthApiError } from "@supabase/supabase-js";

export async function POST(request: Request) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return Response.json(
            {
                error: "Request body must contain valid JSON"
            },
            {
                status: 400
            }
        );
    }

    const validation = signInSchema.safeParse(body)

    if (!validation.success) {
        return Response.json(
            {
                error: "Invalid sign-in data",
                fields: validation.error.flatten().fieldErrors,
            },
            {
                status: 400
            }
        );
    }

    try {
        const supabase = await createClient();

        const result = await signInUser(supabase, validation.data);

        return Response.json(
            {
                user: result
            },
            {
                status: 200
            }
        );
    } catch (error) {
        console.error("Sign-in failed: ", error)

        if (error instanceof AuthApiError) {
            return Response.json(
                {
                    error: error.message,
                    code: error.code
                },
                { 
                    status: error.status || 400
                }
            )
        }

        return Response.json(
            {
                error: "Internal server error"
            },
            {
                status: 500
            }
        )
    }
}