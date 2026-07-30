import { NextResponse } from "next/server";
import { signOutUser } from "@/features/auth/auth-service";

export async function POST() {
  try {
    const result = await signOutUser();

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        message: "Signed out successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Sign-out error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}