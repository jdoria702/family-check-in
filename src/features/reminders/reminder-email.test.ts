import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: mocks.createTransport,
  },
}));

import { sendCheckInReminder } from "./reminder-email";

describe("sendCheckInReminder", () => {
    beforeEach(() => {
        vi.resetAllMocks();

        process.env.GMAIL_USER = "sender@example.com";
        process.env.GMAIL_APP_PASSWORD = "test-app-password";

        mocks.createTransport.mockReturnValue({
                sendMail: mocks.sendMail,
            });
    });

    afterEach(() => {
        delete process.env.GMAIL_USER;
        delete process.env.GMAIL_APP_PASSWORD;
    });

    it("sends a check-in reminder to the member", async () => {
        mocks.sendMail.mockResolvedValue({
            messageId: "message-1",
        });

        const result = await sendCheckInReminder({
            email: "member@example.com",
            memberName: "Alice",
            checkInUrl: "https://example.com/check-in",
        });

        expect(mocks.createTransport).toHaveBeenCalledWith({
            service: "gmail",
            auth: {
                user: "sender@example.com",
                pass: "test-app-password",
            },
        });

        expect(mocks.sendMail).toHaveBeenCalledWith({
            from: "Family Wellness <sender@example.com>",
            to: "member@example.com",
            subject: "Family Wellness check-in reminder",
            text: expect.stringContaining(
                "https://example.com/check-in",
            ),
        });

        expect(result).toEqual({
            messageId: "message-1",
        });
    });
});