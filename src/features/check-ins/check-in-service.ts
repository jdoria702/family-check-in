import { prisma } from "@/lib/prisma"
import type { CreateCheckInServiceInput } from "./check-in-schema"

type GetCaretakerDashboardInput = {
    caretakerId: string;
    startOfToday: Date;
    startOfTomorrow: Date;
};

type GetMemberHistoryInput = {
    caretakerId: string;
    memberId: string;
}

type MemberHistoryResult = {
    member: {
        id: string;
        name: string;
    };
    checkIns: {
        id: string;
        generalFeeling: number;
        notes: string | null;
        submittedAt: Date;
    }[];
}

export async function createCheckIn(input: CreateCheckInServiceInput) {
    return prisma.checkIn.create({
        data: {
            memberId: input.memberId,
            generalFeeling: input.generalFeeling,
            notes: input.notes ?? null
        }
    })
}

export async function getCaretakerDashboard(input: GetCaretakerDashboardInput) {
    const relationships = await prisma.careRelationship.findMany({
        where: {
            caretakerId: input.caretakerId,
            accessPeriods: {
                some: {
                    endedAt: null
                }
            }
        },
        select: {
            member: {
                select: {
                    id: true,
                    name: true
                }
            },
            accessPeriods: {
                where: {
                    endedAt: null
                },
                orderBy: {
                    startedAt: "desc"
                },
                take: 1,
                select: {
                    startedAt: true
                }
            }
        }
    })

    return Promise.all(
        relationships.map(async (relationship) => {
            const activeAccessPeriod = relationship.accessPeriods[0]

            if (!activeAccessPeriod) {
                throw new Error("Active access period was not found")
            }

            const visibleFrom =
                activeAccessPeriod.startedAt > input.startOfToday
                    ? activeAccessPeriod.startedAt
                    : input.startOfToday

            const latestCheckIn = await prisma.checkIn.findFirst({
                where: {
                    memberId: relationship.member.id,
                    submittedAt: {
                        gte: visibleFrom,
                        lt: input.startOfTomorrow
                    }
                },
                orderBy: {
                    submittedAt: "desc"
                },
                select: {
                    id: true,
                    generalFeeling: true,
                    notes: true,
                    submittedAt: true
                }
            })

            return {
                memberId: relationship.member.id,
                name: relationship.member.name,
                checkedInToday: latestCheckIn !== null,
                latestCheckIn
            }
        })
    )
}

export async function getMemberCheckInHistory(input: GetMemberHistoryInput): Promise<MemberHistoryResult> {
    const relationship = await prisma.careRelationship.findFirst({
        where: {
            caretakerId: input.caretakerId,
            memberId: input.memberId,
            accessPeriods: {
                some: {
                    endedAt: null
                }
            }
        },
        select: {
            member: {
                select: {
                    id: true,
                    name: true
                }
            },
            accessPeriods: {
                where: {
                    endedAt: null
                },
                orderBy: {
                    startedAt: "desc"
                },
                take: 1,
                select: {
                    startedAt: true
                }
            }
        }
    })

    if (!relationship) {
        throw new Error("Caretaker does not have access to this member")
    }

    const activeAccessPeriod = relationship.accessPeriods[0]

    if (!activeAccessPeriod) {
        throw new Error("Active access period was not found")
    }

    const checkIns = await prisma.checkIn.findMany({
        where: {
            memberId: input.memberId,
            submittedAt: {
                gte: activeAccessPeriod.startedAt
            }
        },
        select: {
            id: true,
            generalFeeling: true,
            notes: true,
            submittedAt: true
        },
        orderBy: {
            submittedAt: "desc"
        }
    })

    return {
        member: relationship.member,
        checkIns
    }
}