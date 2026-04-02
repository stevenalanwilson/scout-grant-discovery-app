-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "GrantStatus" AS ENUM ('NEW', 'UPDATED', 'ACTIVE', 'MAY_HAVE_CLOSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EligibilityVerdict" AS ENUM ('LIKELY_ELIGIBLE', 'PARTIAL', 'LIKELY_INELIGIBLE');

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "membershipNumber" TEXT NOT NULL,
    "charityNumber" TEXT,
    "postcode" TEXT NOT NULL,
    "region" TEXT,
    "sections" TEXT[],
    "membershipCount" INTEGER NOT NULL,
    "fundingPurposes" TEXT[],
    "additionalContext" TEXT,
    "deprivationFlag" BOOLEAN,
    "deprivationOverride" BOOLEAN,
    "deprivationOverrideReason" TEXT,
    "ruralFlag" BOOLEAN,
    "ruralOverride" BOOLEAN,
    "ruralOverrideReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "AgentRunStatus" NOT NULL,
    "grantsFoundCount" INTEGER NOT NULL DEFAULT 0,
    "grantsNewCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grant" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "funder" TEXT NOT NULL,
    "description" TEXT,
    "fundingPurposes" TEXT[],
    "awardMin" INTEGER,
    "awardMax" INTEGER,
    "awardTypical" INTEGER,
    "eligibilityCriteria" JSONB,
    "geographicScope" TEXT,
    "deadline" TIMESTAMP(3),
    "sourceUrl" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "status" "GrantStatus" NOT NULL,
    "detailsIncomplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityResult" (
    "id" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "verdict" "EligibilityVerdict" NOT NULL,
    "criteriaResults" JSONB NOT NULL,
    "supplementaryAnswers" JSONB,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EligibilityResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortlistItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortlistItem_groupId_grantId_key" ON "ShortlistItem"("groupId", "grantId");

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityResult" ADD CONSTRAINT "EligibilityResult_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityResult" ADD CONSTRAINT "EligibilityResult_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortlistItem" ADD CONSTRAINT "ShortlistItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortlistItem" ADD CONSTRAINT "ShortlistItem_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
