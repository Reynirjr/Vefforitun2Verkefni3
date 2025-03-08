/*
  Warnings:

  - Made the column `answer` on table `Questions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Questions" ALTER COLUMN "answer" SET NOT NULL;
