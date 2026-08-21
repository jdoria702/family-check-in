import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
    transaction: vi.fn(),

    careInvitationFindUnique: vi.fn(),
    careInvitationUpdateMany: vi.fn(),

    careRelationshipUpsert: vi.fn(),

    careAccessPeriodFindFirst: vi.fn(),
    careAccessPeriodCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        $transaction: mocks.transaction,
    },
}));

import { claimInvitation } from "./care-service";

describe("claimInvitation", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        const fakeTransactionClient = {
            careInvitation: {
                findUnique: mocks.careInvitationFindUnique,
                updateMany: mocks.careInvitationUpdateMany,
            },

            careRelationship: {
                upsert: mocks.careRelationshipUpsert,
            },

            careAccessPeriod: {
                findFirst: mocks.careAccessPeriodFindFirst,
                create: mocks.careAccessPeriodCreate,
            },
        };

        mocks.transaction.mockImplementation(
            async (
                callback: (
                    tx: typeof fakeTransactionClient,
                ) => Promise<unknown>,
            ) => callback(fakeTransactionClient),
        );
    });

    it("rejects an invitation code that does not exist", async () => {
        mocks.careInvitationFindUnique.mockResolvedValue(null);

        await expect(
            claimInvitation({
                code: "abcd1234",
                memberId: "member-1",
            }),
        ).rejects.toThrow("Invitation not found!");

        expect(mocks.transaction).toHaveBeenCalledOnce();
        expect(mocks.careInvitationFindUnique).toHaveBeenCalledOnce();
    });

    it("rejects an invitation that is no longer active", async () => {
        mocks.careInvitationFindUnique.mockResolvedValue({
            id: "invitation-1",
            caretakerId: "caretaker-1",
            claimedById: "someone",
            status: "CLAIMED",
            expiresAt: new Date("2099-01-01T00:00:00.000Z"),
            caretaker: {
            name: "Jason",
            },
        });

        await expect(
            claimInvitation({
            code: "abcd1234",
            memberId: "member-1",
            }),
        ).rejects.toThrow(
            "Invitation has already been claimed or is inactive",
        );

        expect(mocks.transaction).toHaveBeenCalledOnce();
        expect(mocks.careInvitationFindUnique).toHaveBeenCalledOnce();
    });

    it("rejects an invitation that is already claimed", async () => {
        mocks.careInvitationFindUnique.mockResolvedValue({
            id: "invitation-2",
            caretakerId: "caretaker-1",
            claimedById: "someone",
            status: "ACTIVE",
            expiresAt: new Date("2099-01-01T00:00:00.000Z"),
            caretaker: {
            name: "Alice",
            },
        });

        await expect(
            claimInvitation({
            code: "abcd1234",
            memberId: "member-1",
            }),
        ).rejects.toThrow(
            "Invitation has already been claimed",
        );

        expect(mocks.transaction).toHaveBeenCalledOnce();
        expect(mocks.careInvitationFindUnique).toHaveBeenCalledOnce();
    });

    it("rejects an invitation that is expired", async () => {
        mocks.careInvitationFindUnique.mockResolvedValue({
            id: "invitation-2",
            caretakerId: "caretaker-1",
            claimedById: null,
            status: "ACTIVE",
            expiresAt: new Date("1099-01-01T00:00:00.000Z"),
            caretaker: {
            name: "Bob",
            },
        });

        await expect(
            claimInvitation({
            code: "abcd1234",
            memberId: "member-1",
            }),
        ).rejects.toThrow(
            "Invitation has expired",
        );

        expect(mocks.transaction).toHaveBeenCalledOnce();
        expect(mocks.careInvitationFindUnique).toHaveBeenCalledOnce();
    });

    it("rejects own invitation", async () => {
        mocks.careInvitationFindUnique.mockResolvedValue({
            id: "invitation-4",
            caretakerId: "caretaker-1",
            claimedById: null,
            status: "ACTIVE",
            expiresAt: new Date("2099-01-01T00:00:00.000Z"),
            caretaker: {
            name: "Bob",
            },
        });

        await expect(
            claimInvitation({
            code: "abcd1234",
            memberId: "caretaker-1",
            }),
        ).rejects.toThrow(
            "You cannot claim your own invitation",
        );

        expect(mocks.transaction).toHaveBeenCalledOnce();
        expect(mocks.careInvitationFindUnique).toHaveBeenCalledOnce();
    });

    it("rejects an invitation claimed by another request", async () => {
        mocks.careInvitationFindUnique.mockResolvedValue({
            id: "invitation-1",
            caretakerId: "caretaker-1",
            claimedById: null,
            status: "ACTIVE",
            expiresAt: new Date("2099-01-01T00:00:00.000Z"),
            caretaker: {
                name: "Alice",
            },
        });

        mocks.careInvitationUpdateMany.mockResolvedValue({
            count: 0,
        });

        await expect(
            claimInvitation({
                code: "abcd1234",
                memberId: "member-1",
            }),
        ).rejects.toThrow(
            /^Invitation has already been claimed$/,
        );

        expect(mocks.careInvitationUpdateMany).toHaveBeenCalledWith({
            where: {
                id: "invitation-1",
                status: "ACTIVE",
                claimedById: null,
            },
            data: {
                status: "CLAIMED",
                claimedById: "member-1",
                claimedAt: expect.any(Date),
            },
        });

        expect(mocks.careInvitationFindUnique).toHaveBeenCalledOnce();
        expect(mocks.careInvitationUpdateMany).toHaveBeenCalledOnce();
    });

    it("rejects when a pending or active connection already exists", async () => {
        mocks.careInvitationFindUnique.mockResolvedValue({
                id: "invitation-1",
                caretakerId: "caretaker-1",
                claimedById: null,
                status: "ACTIVE",
                expiresAt: new Date("2099-01-01T00:00:00.000Z"),
                caretaker: {
                name: "Alice",
            },
        });

        mocks.careInvitationUpdateMany.mockResolvedValue({
            count: 1,
        });

        mocks.careRelationshipUpsert.mockResolvedValue({
            id: "relationship-1",
        });

        mocks.careAccessPeriodFindFirst.mockResolvedValue({
            id: "access-period-1",
        });

        await expect(
            claimInvitation({
                code: "abcd1234",
                memberId: "member-1",
            }),
        ).rejects.toThrow(
            /^A pending or active care connection already exists$/,
        );

        expect(
            mocks.careRelationshipUpsert,
        ).toHaveBeenCalledWith({
            where: {
                caretakerId_memberId: {
                    caretakerId: "caretaker-1",
                    memberId: "member-1",
                },
            },
            create: {
                caretakerId: "caretaker-1",
                memberId: "member-1",
            },
            update: {},
        });

        expect(
            mocks.careAccessPeriodFindFirst,
        ).toHaveBeenCalledWith({
            where: {
                relationshipId: "relationship-1",
                status: {
                    in: ["PENDING_CARETAKER", "ACTIVE"],
                },
            },
        });

        expect(
            mocks.careAccessPeriodCreate,
        ).not.toHaveBeenCalled();
    });

    it("successfully claims a valid invitation", async () => {
        mocks.careInvitationFindUnique.mockResolvedValue({
            id: "invitation-1",
            caretakerId: "caretaker-1",
            claimedById: null,
            status: "ACTIVE",
            expiresAt: new Date("2099-01-01T00:00:00.000Z"),
            caretaker: {
                name: "Alice",
            },
        });

        mocks.careInvitationUpdateMany.mockResolvedValue({
            count: 1,
        });

        mocks.careRelationshipUpsert.mockResolvedValue({
            id: "relationship-1",
        });

        mocks.careAccessPeriodFindFirst.mockResolvedValue(null);

        mocks.careAccessPeriodCreate.mockResolvedValue({
            id: "access-period-1",
        });

        const result = await claimInvitation({
            code: "abcd1234",
            memberId: "member-1",
        });

        expect(result).toEqual({
            caretaker: {
                name: "Alice",
            },
            claimedAt: expect.any(Date),
            relationshipId: "relationship-1",
            accessPeriodId: "access-period-1",
        });

        expect(
            mocks.careAccessPeriodCreate,
        ).toHaveBeenCalledWith({
            data: {
                relationshipId: "relationship-1",
                status: "PENDING_CARETAKER",
            },
        });

        expect(
            mocks.careInvitationUpdateMany,
        ).toHaveBeenCalledWith({
            where: {
                id: "invitation-1",
                status: "ACTIVE",
                claimedById: null,
            },
            data: {
                status: "CLAIMED",
                claimedById: "member-1",
                claimedAt: result.claimedAt,
            },
        });

        expect(mocks.transaction).toHaveBeenCalledOnce();

        expect(
            mocks.careInvitationFindUnique,
        ).toHaveBeenCalledOnce();

        expect(
            mocks.careInvitationUpdateMany,
        ).toHaveBeenCalledOnce();

        expect(
            mocks.careRelationshipUpsert,
        ).toHaveBeenCalledOnce();

        expect(
            mocks.careAccessPeriodFindFirst,
        ).toHaveBeenCalledOnce();

        expect(
            mocks.careAccessPeriodCreate,
        ).toHaveBeenCalledOnce();
    });
});