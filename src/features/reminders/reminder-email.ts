import nodemailer from "nodemailer";

type SendCheckInReminderInput = {
    email: string;
    memberName: string;
    checkInUrl: string;
}

type SendCheckInReminderResult = {
    messageId: string;
}

function getRequiredEnvironmentVariable(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} is not defined`);
    }

    return value;
}

export async function sendCheckInReminder(input: SendCheckInReminderInput): Promise<SendCheckInReminderResult> {
    const gmailUser = getRequiredEnvironmentVariable("GMAIL_USER");
    const gmailAppPassword = getRequiredEnvironmentVariable("GMAIL_APP_PASSWORD");

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: gmailUser,
            pass: gmailAppPassword,
        },
    });

    const message = await transporter.sendMail({
        from: `Family Wellness <${gmailUser}>`,
        to: input.email,
        subject: "Family Wellness check-in reminder",
        text: [
            `Hello ${input.memberName},`,
            "",
            "You have not submitted your Family Wellness check-in today.",
            "Please use the following link to complete it:",
            "",
            input.checkInUrl,
            "",
            "If you already completed your check-in, you can ignore this message.",
        ].join("\n"),
    });

    return { messageId: message.messageId };
}