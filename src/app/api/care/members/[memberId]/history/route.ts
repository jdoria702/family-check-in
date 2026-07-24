import { NextResponse } from "next/server"
import { getMemberCheckInHistory } from "@/features/check-ins/check-in-service"
import { createClient } from "@/lib/supabase/server"

export async function GET(_request: Request, { params }: { params: Promise<{ memberId: string }>}) {
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

        const { memberId } = await params;
        
        const history = await getMemberCheckInHistory({
            caretakerId: user.id,
            memberId
        })

        return NextResponse.json(history);
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