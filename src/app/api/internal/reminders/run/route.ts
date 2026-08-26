import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { runReminders } from "@/features/reminders/reminder-service";

export const runtime = "nodejs";

function securelyCompare(
  received: string,
  expected: string,
): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  if (
    receivedBuffer.length !== expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer,
  );
}

export async function POST(request: Request) {
  const expectedSecret =
    process.env.REMINDER_SCHEDULER_SECRET;

  const appBaseUrl = process.env.APP_BASE_URL;

  if (!expectedSecret || !appBaseUrl) {
    console.error(
      "Reminder scheduler configuration is missing",
    );

    return NextResponse.json(
      {
        error: "Reminder service is not configured",
      },
      {
        status: 500,
      },
    );
  }

  const receivedSecret = request.headers.get(
    "x-reminder-secret",
  );

  if (
    !receivedSecret ||
    !securelyCompare(
      receivedSecret,
      expectedSecret,
    )
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const result = await runReminders({
      now: new Date(),
      appBaseUrl,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Reminder run failed", error);

    return NextResponse.json(
      {
        error: "Reminder run failed",
      },
      {
        status: 500,
      },
    );
  }
}