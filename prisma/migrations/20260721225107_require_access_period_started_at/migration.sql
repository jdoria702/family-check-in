/*
  Warnings:

  - Made the column `started_at` on table `care_access_periods` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "care_access_periods" ALTER COLUMN "started_at" SET NOT NULL,
ALTER COLUMN "started_at" SET DEFAULT CURRENT_TIMESTAMP;
