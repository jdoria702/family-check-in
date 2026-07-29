import { registerSchema } from "@/features/auth/auth-schema";
import { registerUser } from "@/features/auth/auth-service";
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server";

/*
  Handles user registration requests
    - Parses JSON body from the request
    - Validates the input against the registerSchema
    - Calls registerUser to create a new user in the database
    - Returns appropriate HTTP responses based on the outcome
*/

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return Response.json(
      {
        error: "Invalid JSON"
      }, 
      {
        status: 400
      }
    );
  }

  const validation = registerSchema.safeParse(body);

  if (!validation.success) {
    return Response.json(
      {
        error: "Invalid registration data",
        details: validation.error.flatten().fieldErrors
      }, 
      {
        status: 400
      }
    );
  }

  try {

      // Remove any existing browser session before registering another user.
      const supabase = await createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        const { error: signOutError } = await supabase.auth.signOut();

        if (signOutError) {
          return NextResponse.json(
            { error: "Unable to clear the existing session." },
            { status: 500 }
          );
        }
      }



    const result = await registerUser(validation.data);

    return Response.json(
      {
        user: result
      },
      {
        status: 201
      }
    )
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create account"
      },
      {
        status: 500
      }
    )
  }
}