import { prisma } from "@/lib/prisma"
import type { InvitationCodeInput } from "./care.schemas";
import crypto from "node:crypto";

function generateInvitationCode(): string {
    return crypto.randomBytes(4).toString("hex");
}

function hashInvitationCode(code: string): string {
    return crypto
        .createHash("sha256")
        .update(code)
        .digest("hex")
}

type ClaimInvitationServiceInput = {
    code: string;
    memberId: string;
};

type CreatedInvitationResult = {
    code: string;
    expiresAt: Date;
}

type PreviewInvitationResult = {
    caretaker: {
        name: string;
    }
    expiresAt: Date;
}

type ClaimInvitationResult = {
    caretaker: {
        name: string;
    }
    claimedAt: Date;
    relationshipId: string;
    accessPeriodId: string;
}

export async function createInvitation(caretakerId: string): Promise<CreatedInvitationResult> {
    const code = generateInvitationCode();
    const codeHash = hashInvitationCode(code);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.careInvitation.create({
        data: {
            caretakerId,
            codeHash,
            expiresAt,
            status: "ACTIVE",
        }
    })

    return {
        code,
        expiresAt,
    }
}

export async function previewInvitation(input: InvitationCodeInput): Promise<PreviewInvitationResult> {
    const codeHash = hashInvitationCode(input.code.trim());
    
    const invitation = await prisma.careInvitation.findUnique({
        where: {
            codeHash,
        },
        include: {
            caretaker: {
                select: {
                    name: true,
                }
            }
        }
    })

    if (!invitation) {
        throw new Error("Invitation not found!")
    }

    if (invitation.status !== "ACTIVE") {
        throw new Error("Invitation is no longer active!")
    }

    if (invitation.expiresAt <= new Date()) {
        throw new Error("Invitation has expired!")
    }

    return {
        caretaker: {
            name: invitation.caretaker.name,
        },
        expiresAt: invitation.expiresAt,
    }
}

export async function claimInvitation(input: ClaimInvitationServiceInput): Promise<ClaimInvitationResult> {
    const codeHash = hashInvitationCode(input.code)
    const claimedAt = new Date()

    return prisma.$transaction(async (tx) => {
        const invitation = await tx.careInvitation.findUnique({
            where: {
                codeHash,
            },
            select: {
                id: true,
                caretakerId: true,
                claimedById: true,
                status: true,
                expiresAt: true,
                caretaker: {
                    select: {
                        name: true,
                    }
                }
            }
        })

        if (!invitation) {
            throw new Error("Invitation not found!")
        }

        if (invitation.status !== "ACTIVE") {
            throw new Error("Invitation has already been claimed or is inactive");
        }

        if (invitation.claimedById !== null) {
            throw new Error("Invitation has already been claimed");
        }

        if (invitation.expiresAt <= claimedAt) {
            throw new Error("Invitation has expired");
        }

        if (invitation.caretakerId === input.memberId) {
            throw new Error("You cannot claim your own invitation");
        }

        const updatedInvitation = await tx.careInvitation.updateMany({
            where: {
                id: invitation.id,
                status: "ACTIVE",
                claimedById: null,
            },
            data: {
                status: "CLAIMED",
                claimedById: input.memberId,
                claimedAt,
            }
        })

        if (updatedInvitation.count !== 1) {
            throw new Error("Invitation has already been claimed")
        }

        const relationship  = await tx.careRelationship.upsert({
            where: {
                caretakerId_memberId: {
                    caretakerId: invitation.caretakerId,
                    memberId: input.memberId
                },
            },
            create: {
                caretakerId: invitation.caretakerId,
                memberId: input.memberId,
            },
            update: {},
        })

        const existingAccessPeriod = await tx.careAccessPeriod.findFirst({
            where: {
                relationshipId: relationship.id,
                status: {
                    in: ["PENDING_CARETAKER", "ACTIVE"]
                }
            }
        })

        if (existingAccessPeriod) {
            throw new Error("A pending or active care connection already exists")
        }

        const accessPeriod = await tx.careAccessPeriod.create({
            data: {
                relationshipId: relationship.id,
                status: "PENDING_CARETAKER",
            }
        })

        return {
            caretaker: {
                name: invitation.caretaker.name,
            },
            claimedAt,
            relationshipId: relationship.id,
            accessPeriodId: accessPeriod.id,
        }
    })
}