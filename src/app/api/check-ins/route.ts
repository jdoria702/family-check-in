import { createClient } from "@/lib/supabase/server";
import { createCheckIn } from "@/features/check-ins/check-in-service";
import { NextResponse } from "next/server";
import { createCheckInSchema } from "@/features/check-ins/check-in-schema";

/*
    Create check-ins
    @params: generalFeeling (int), notes (string | null)
    @return: TODO
*/

export async function POST(request: Request) {
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


        const body = await request.json();
        const validation = createCheckInSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Invalid check-in input",
                    details: validation.error.flatten().fieldErrors,
                },
                {
                    status: 400,
                }
            )
        }

        const generalFeeling = validation.data.generalFeeling;
        const notes = validation.data.notes ?? undefined;

        const result = await createCheckIn({
            generalFeeling,
            notes: notes,
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