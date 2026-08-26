import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  preferenceFindMany: vi.fn(),
  deliveryCreate: vi.fn(),
  deliveryUpdate: vi.fn(),
  sendCheckInReminder: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reminderPreference: {
      findMany: mocks.preferenceFindMany,
    },
    reminderDelivery: {
      create: mocks.deliveryCreate,
      update: mocks.deliveryUpdate,
    },
  },
}));

vi.mock("./reminder-email", () => ({
  sendCheckInReminder:
    mocks.sendCheckInReminder,
}));

import { runReminders } from "./reminder-service";

describe("runReminders", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("skips a member before their reminder time", async () => {
    mocks.preferenceFindMany.mockResolvedValue([
        {
        memberId: "member-1",
        reminderEmail: "alice@example.com",
        reminderTime: "19:00",
        timeZone: "UTC",
        member: {
            name: "Alice",
            checkIns: [],
        },
        },
    ]);

    const result = await runReminders({
        now: new Date("2026-08-24T18:00:00.000Z"),
        appBaseUrl: "https://example.com",
    });

    expect(result).toEqual({
        examined: 1,
        eligible: 0,
        sent: 0,
        failed: 0,
        skipped: 1,
    });

    expect(
        mocks.deliveryCreate,
    ).not.toHaveBeenCalled();

    expect(
        mocks.sendCheckInReminder,
    ).not.toHaveBeenCalled();
  });

  it("skips a member who already checked in today", async () => {
    mocks.preferenceFindMany.mockResolvedValue([
        {
        memberId: "member-1",
        reminderEmail: "alice@example.com",
        reminderTime: "17:00",
        timeZone: "UTC",
        member: {
            name: "Alice",
            checkIns: [
            {
                submittedAt: new Date(
                "2026-08-24T10:00:00.000Z",
                ),
            },
            ],
        },
        },
    ]);

    const result = await runReminders({
        now: new Date("2026-08-24T18:00:00.000Z"),
        appBaseUrl: "https://example.com",
    });

    expect(result).toEqual({
        examined: 1,
        eligible: 0,
        sent: 0,
        failed: 0,
        skipped: 1,
    });

    expect(
        mocks.deliveryCreate,
    ).not.toHaveBeenCalled();

    expect(
        mocks.sendCheckInReminder,
    ).not.toHaveBeenCalled();

    expect(
        mocks.preferenceFindMany,
    ).toHaveBeenCalledWith({
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
                    gte: new Date(
                        "2026-08-22T18:00:00.000Z",
                    ),
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
  });

  it("sends a reminder to an eligible member", async () => {
    mocks.preferenceFindMany.mockResolvedValue([
        {
        memberId: "member-1",
        reminderEmail: "alice@example.com",
        reminderTime: "17:00",
        timeZone: "UTC",
        member: {
            name: "Alice",
            checkIns: [],
        },
        },
    ]);

    mocks.deliveryCreate.mockResolvedValue({
        id: "delivery-1",
    });

    mocks.sendCheckInReminder.mockResolvedValue({
        messageId: "message-1",
    });

    mocks.deliveryUpdate.mockResolvedValue({
        id: "delivery-1",
        status: "SENT",
    });

    const result = await runReminders({
        now: new Date("2026-08-24T18:00:00.000Z"),
        appBaseUrl: "https://example.com",
    });

    expect(result).toEqual({
        examined: 1,
        eligible: 1,
        sent: 1,
        failed: 0,
        skipped: 0,
    });

    expect(mocks.deliveryCreate).toHaveBeenCalledWith({
        data: {
            memberId: "member-1",
            reminderDate: new Date(
                "2026-08-24T00:00:00.000Z",
            ),
        status: "PENDING",
        },
        select: {
            id: true,
        },
    });

    expect(
        mocks.sendCheckInReminder,
    ).toHaveBeenCalledWith({
        email: "alice@example.com",
        memberName: "Alice",
        checkInUrl: "https://example.com/check-in",
    });

    expect(mocks.deliveryUpdate).toHaveBeenCalledWith({
        where: {
            id: "delivery-1",
        },
        data: {
            status: "SENT",
            sentAt: expect.any(Date),
            errorMessage: null,
        },
    });
  });

  it("marks the delivery as failed when email sending fails", async () => {
    mocks.preferenceFindMany.mockResolvedValue([
        {
            memberId: "member-1",
            reminderEmail: "alice@example.com",
            reminderTime: "17:00",
            timeZone: "UTC",
            member: {
                name: "Alice",
                checkIns: [],
            },
        },
    ]);

    mocks.deliveryCreate.mockResolvedValue({
        id: "delivery-1",
    });

    mocks.sendCheckInReminder.mockRejectedValue(
        new Error("SMTP unavailable"),
    );

    mocks.deliveryUpdate.mockResolvedValue({
        id: "delivery-1",
        status: "FAILED",
    });

    const result = await runReminders({
        now: new Date("2026-08-24T18:00:00.000Z"),
        appBaseUrl: "https://example.com",
    });

    expect(result).toEqual({
        examined: 1,
        eligible: 1,
        sent: 0,
        failed: 1,
        skipped: 0,
    });

    expect(
        mocks.sendCheckInReminder,
    ).toHaveBeenCalledWith({
        email: "alice@example.com",
        memberName: "Alice",
        checkInUrl: "https://example.com/check-in",
    });

    expect(mocks.deliveryUpdate).toHaveBeenCalledWith({
        where: {
            id: "delivery-1",
        },
        data: {
            status: "FAILED",
            errorMessage: "SMTP unavailable",
        },
    });

    expect(mocks.deliveryUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({
            data: expect.objectContaining({
            status: "SENT",
            }),
        }),
    );
  });

  it("skips sending when today's delivery already exists", async () => {
    mocks.preferenceFindMany.mockResolvedValue([
        {
            memberId: "member-1",
            reminderEmail: "alice@example.com",
            reminderTime: "17:00",
            timeZone: "UTC",
            member: {
                name: "Alice",
                checkIns: [],
            },
        },
    ]);

    mocks.deliveryCreate.mockRejectedValue({
        code: "P2002",
    });

    const result = await runReminders({
        now: new Date("2026-08-24T18:00:00.000Z"),
        appBaseUrl: "https://example.com",
    });

    expect(result).toEqual({
        examined: 1,
        eligible: 1,
        sent: 0,
        failed: 0,
        skipped: 1,
    });

    expect(mocks.deliveryCreate).toHaveBeenCalledWith({
        data: {
            memberId: "member-1",
            reminderDate: new Date(
                "2026-08-24T00:00:00.000Z",
            ),
            status: "PENDING",
        },
        select: {
            id: true,
        },
    });

    expect(
        mocks.sendCheckInReminder,
    ).not.toHaveBeenCalled();

    expect(
        mocks.deliveryUpdate,
    ).not.toHaveBeenCalled();
  });
});