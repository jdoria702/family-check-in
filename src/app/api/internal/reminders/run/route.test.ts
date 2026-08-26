import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  runReminders: vi.fn(),
}));

vi.mock(
  "@/features/reminders/reminder-service",
  () => ({
    runReminders: mocks.runReminders,
  }),
);

import { POST } from "./route";

describe("POST /api/internal/reminders/run", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    process.env.REMINDER_SCHEDULER_SECRET =
      "correct-test-secret";

    process.env.APP_BASE_URL =
      "https://example.com";

    vi.spyOn(console, "error").mockImplementation(
      () => undefined,
    );
  });

  afterEach(() => {
    delete process.env.REMINDER_SCHEDULER_SECRET;
    delete process.env.APP_BASE_URL;

    vi.restoreAllMocks();
  });

  it("returns 500 when configuration is missing", async () => {
    delete process.env.REMINDER_SCHEDULER_SECRET;

    const request = new Request(
        "https://example.com/api/internal/reminders/run",
        {
        method: "POST",
        },
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
        error: "Reminder service is not configured",
    });

    expect(
        mocks.runReminders,
    ).not.toHaveBeenCalled();
  });

  it("returns 401 for an incorrect scheduler secret", async () => {
    const request = new Request(
        "https://example.com/api/internal/reminders/run",
        {
        method: "POST",
        headers: {
            "x-reminder-secret": "wrong-secret",
        },
        },
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);

    expect(body).toEqual({
        error: "Unauthorized",
    });

    expect(
        mocks.runReminders,
    ).not.toHaveBeenCalled();
  });

  it("runs reminders for an authorized request", async () => {
    mocks.runReminders.mockResolvedValue({
        examined: 3,
        eligible: 2,
        sent: 2,
        failed: 0,
        skipped: 1,
    });

    const request = new Request(
        "https://example.com/api/internal/reminders/run",
        {
        method: "POST",
        headers: {
            "x-reminder-secret":
            "correct-test-secret",
        },
        },
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toEqual({
        examined: 3,
        eligible: 2,
        sent: 2,
        failed: 0,
        skipped: 1,
    });

    expect(
        mocks.runReminders,
    ).toHaveBeenCalledWith({
        now: expect.any(Date),
        appBaseUrl: "https://example.com",
    });

    expect(
        mocks.runReminders,
    ).toHaveBeenCalledOnce();
  });

  it("returns 500 when the reminder run fails", async () => {
    mocks.runReminders.mockRejectedValue(
        new Error("Database unavailable"),
    );

    const request = new Request(
        "https://example.com/api/internal/reminders/run",
        {
        method: "POST",
        headers: {
            "x-reminder-secret":
            "correct-test-secret",
        },
        },
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
        error: "Reminder run failed",
    });

    expect(console.error).toHaveBeenCalledWith(
        "Reminder run failed",
        expect.any(Error),
    );
  });
});