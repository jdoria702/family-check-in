/*
  Warnings:

  - Changed the type of `memberId` on the `ReminderDelivery` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ReminderDelivery" DROP COLUMN "memberId",
ADD COLUMN     "memberId" UUID NOT NULL,
ALTER COLUMN "reminderDate" SET DATA TYPE DATE;

-- CreateTable
CREATE TABLE "ReminderPreference" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderEmail" TEXT NOT NULL,
    "reminderTime" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReminderPreference_memberId_key" ON "ReminderPreference"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderDelivery_memberId_reminderDate_key" ON "ReminderDelivery"("memberId", "reminderDate");

-- AddForeignKey
ALTER TABLE "ReminderDelivery" ADD CONSTRAINT "ReminderDelivery_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderPreference" ADD CONSTRAINT "ReminderPreference_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
