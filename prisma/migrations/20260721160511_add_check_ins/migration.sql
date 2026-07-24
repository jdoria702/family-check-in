-- CreateTable
CREATE TABLE "check_ins" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "generalFeeling" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "check_ins_memberId_idx" ON "check_ins"("memberId");

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
