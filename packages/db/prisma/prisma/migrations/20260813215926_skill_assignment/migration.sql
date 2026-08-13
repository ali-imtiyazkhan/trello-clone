-- CreateEnum
CREATE TYPE "SkillSource" AS ENUM ('RESUME', 'GITHUB', 'MANUAL');

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "requiredSkills" TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubSyncedAt" TIMESTAMP(3),
ADD COLUMN     "githubUsername" TEXT;

-- CreateTable
CREATE TABLE "UserSkill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "SkillSource" NOT NULL DEFAULT 'MANUAL',
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubCache" (
    "username" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GithubCache_pkey" PRIMARY KEY ("username")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSkill_userId_name_key" ON "UserSkill"("userId", "name");

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
