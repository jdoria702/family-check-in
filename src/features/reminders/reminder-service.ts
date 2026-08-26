import { prisma } from "@/lib/prisma";
import { sendCheckInReminder } from "./reminder-email";

type RunRemindersInput = {
    now: Date;
    appBaseUrl: string;
};

type RunRemindersResult = {
    examined: number;
    eligible: number;
    sent: number;
    failed: number;
    skipped: number;
};

type LocalDateTime = {
    date: string;
    time: string;
};

function getLocalDateTime(date: Date, timeZone: string): LocalDateTime {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    });

    const parts = formatter.formatToParts(date);

    const values = Object.fromEntries(
        parts.map((part) => [part.type, part.value]),
    );

    return {
        date: `${values.year}-${values.month}-${values.day}`,
        time: `${values.hour}:${values.minute}`,
    };
}

function createDatabaseDate(localDate: string): Date {
    return new Date(`${localDate}T00:00:00.000Z`);
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return "Unknown email delivery error";
}

function isUniqueConstraintError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
    );
}

export async function runReminders(input: RunRemindersInput): Promise<RunRemindersResult> {
  const earliestRelevantCheckIn = new Date(
    input.now.getTime() - 48 * 60 * 60 * 1000,
  );

  // Get all members that have email preferences on
  const preferences =
    await prisma.reminderPreference.findMany({
      where: {
        enabled: true,
      },
      select: {
        memberId: true,
        reminderEmail: true,
        reminderTime: true,
        timeZone: true,
        member: {
          select: {
            name: true,
            checkIns: {
              where: {
                submittedAt: {
                  gte: earliestRelevantCheckIn,
                },
              },
              select: {
                submittedAt: true,
              },
            },
          },
        },
      },
    });

  const result: RunRemindersResult = {
    examined: preferences.length,
    eligible: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  for (const preference of preferences) {
    const memberLocalNow = getLocalDateTime(
      input.now,
      preference.timeZone,
    );

    // Not time for the member's check in
    if (
      memberLocalNow.time < preference.reminderTime
    ) {
      result.skipped += 1;
      continue;
    }

    // Check whether the member checked in that day
    const checkedInToday =
      preference.member.checkIns.some((checkIn) => {
        const submittedLocalDate = getLocalDateTime(
          checkIn.submittedAt,
          preference.timeZone,
        ).date;

        return (
          submittedLocalDate === memberLocalNow.date
        );
      });

    if (checkedInToday) {
      result.skipped += 1;
      continue;
    }

    result.eligible += 1;

    const reminderDate = createDatabaseDate(
      memberLocalNow.date,
    );

    let delivery: {
      id: string;
    };

    try {
      delivery = await prisma.reminderDelivery.create({
        data: {
          memberId: preference.memberId,
          reminderDate,
          status: "PENDING",
        },
        select: {
          id: true,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        result.skipped += 1;
        continue;
      }

      throw error;
    }

    try {
      const checkInUrl = new URL(
        "/check-in",
        input.appBaseUrl,
      ).toString();

      await sendCheckInReminder({
        email: preference.reminderEmail,
        memberName: preference.member.name,
        checkInUrl,
      });

      await prisma.reminderDelivery.update({
        where: {
          id: delivery.id,
        },
        data: {
          status: "SENT",
          sentAt: new Date(),
          errorMessage: null,
        },
      });

      result.sent += 1;
    } catch (error) {
      await prisma.reminderDelivery.update({
        where: {
          id: delivery.id,
        },
        data: {
          status: "FAILED",
          errorMessage: getErrorMessage(error),
        },
      });

      result.failed += 1;
    }
  }

  return result;
}