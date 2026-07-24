import { createClient } from "@/lib/supabase/server";
import { claimInvitation, createInvitation, previewInvitation } from "@/features/invitation/care-service";
import { NextResponse } from "next/server";
import { invitationCodeSchema } from "@/features/invitation/care.schema";

/*
    Create invitation
    @params: None
    @return: code, expiresAt
*/

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: {user}, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json(
                {
                    error: error?.message,
                    code: error?.code
                },
                {
                    status: error?.status || 401
                }
            )
        }

        const result = await createInvitation(user.id)

        return NextResponse.json(result)
    } catch {
        return NextResponse.json(
            {
                error: "Internal server error"
            },
            {
                status: 500
            }
        )
    }
}

/*
    Preview Invitation
    @params: code
    @return: caretaker: {name}, expiresAt
*/

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const validation = invitationCodeSchema.safeParse({ code });

    if (!validation.success) {
        return Response.json(
            {
                error: "Invalid invitation code",
                details: validation.error.flatten().fieldErrors
            },
            {
                status: 400
            }
        )
    }

    const validatedCode = validation.data.code;

    try {
        const supabase = await createClient();
        const { data: {user}, error } = await supabase.auth.getUser();

        if (error || !user ) {
            return NextResponse.json(
                {
                    error: error?.message,
                    code: error?.code
                },
                {
                    status: error?.status || 401
                }
            )
        }

        const result = await previewInvitation({
            code: validatedCode
        })

        return NextResponse.json(result)
    } catch {
        return NextResponse.json(
            {
                error: "Internal server error"
            },
            {
                status: 500
            }
        )
    }
}

/*
    Claim Invitation
    @params: code
    @return: caretaker: {name}, claimedAt, relationshipId, accessPeriodId
*/

export async function PATCH(request: Request) {
    try {
        const body = await request.json()

        const validation = invitationCodeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Invalid invitation code",
                    details: validation.error.flatten().fieldErrors,
                },
                {
                    status: 400,
                }
            );
        }

        const validatedCode = validation.data.code;

        const supabase = await createClient();
        const { data: {user}, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json(
                {
                    error: error?.message,
                    code: error?.code
                },
                {
                    status: error?.status || 401
                }
            )
        }

        const result = await claimInvitation({
            code: validatedCode,
            memberId: user.id
        })

        return NextResponse.json(result)
    } catch {
        return NextResponse.json(
            {
                error: "Internal server error"
            },
            {
                status: 500
            }
        )
    }
}