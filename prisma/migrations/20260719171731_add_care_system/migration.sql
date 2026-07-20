-- CreateEnum
CREATE TYPE "CareAccessStatus" AS ENUM ('PENDING_CARETAKER', 'ACTIVE', 'DECLINED', 'REVOKED');

-- CreateEnum
CREATE TYPE "CareInvitationStatus" AS ENUM ('ACTIVE', 'CLAIMED', 'APPROVED', 'EXPIRED', 'REVOKED');

-- DropForeignKey
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_id_fkey";

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "care_relationships" (
    "id" UUID NOT NULL,
    "caretaker_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_access_periods" (
    "id" UUID NOT NULL,
    "relationship_id" UUID NOT NULL,
    "status" "CareAccessStatus" NOT NULL DEFAULT 'PENDING_CARETAKER',
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "ended_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_access_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_invitations" (
    "id" UUID NOT NULL,
    "caretaker_id" UUID NOT NULL,
    "claimed_by_id" UUID,
    "code_hash" TEXT NOT NULL,
    "status" "CareInvitationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "claimed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "care_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "care_relationships_caretaker_id_idx" ON "care_relationships"("caretaker_id");

-- CreateIndex
CREATE INDEX "care_relationships_member_id_idx" ON "care_relationships"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "care_relationships_caretaker_id_member_id_key" ON "care_relationships"("caretaker_id", "member_id");

-- CreateIndex
CREATE INDEX "care_access_periods_relationship_id_idx" ON "care_access_periods"("relationship_id");

-- CreateIndex
CREATE INDEX "care_access_periods_relationship_id_status_idx" ON "care_access_periods"("relationship_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "care_invitations_code_hash_key" ON "care_invitations"("code_hash");

-- CreateIndex
CREATE INDEX "care_invitations_caretaker_id_status_idx" ON "care_invitations"("caretaker_id", "status");

-- CreateIndex
CREATE INDEX "care_invitations_expires_at_idx" ON "care_invitations"("expires_at");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_relationships" ADD CONSTRAINT "care_relationships_caretaker_id_fkey" FOREIGN KEY ("caretaker_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_relationships" ADD CONSTRAINT "care_relationships_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_access_periods" ADD CONSTRAINT "care_access_periods_relationship_id_fkey" FOREIGN KEY ("relationship_id") REFERENCES "care_relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_access_periods" ADD CONSTRAINT "care_access_periods_ended_by_id_fkey" FOREIGN KEY ("ended_by_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_invitations" ADD CONSTRAINT "care_invitations_caretaker_id_fkey" FOREIGN KEY ("caretaker_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_invitations" ADD CONSTRAINT "care_invitations_claimed_by_id_fkey" FOREIGN KEY ("claimed_by_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
