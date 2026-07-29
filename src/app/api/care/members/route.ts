import { NextResponse } from "next/server"
import { getCaretakerDashboard } from "@/features/check-ins/check-in-service"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error("Dashboard authentication failed:", authError)

            return NextResponse.json(
                {
                    error: "Unauthorized"
                },
                {
                    status: 401
                }
            )
        }

        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)

        const startOfTomorrow = new Date(startOfToday)
        startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)

        const dashboard = await getCaretakerDashboard({
            caretakerId: user.id,
            startOfToday,
            startOfTomorrow
        })

        return NextResponse.json(
            {
                members: dashboard
            },
            {
                status: 200
            }
        )
    } catch (error) {
        console.error("Failed to retrieve caretaker dashboard:", error)

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