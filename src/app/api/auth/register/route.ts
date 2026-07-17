import { registerSchema } from "@/features/auth/auth-schema";
import { registerUser } from "@/features/auth/auth-service";

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