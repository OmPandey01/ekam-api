/*
  Warnings:

  - Made the column `thumbnail` on table `PublishedDocuments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PublishedDocuments" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'null',
ALTER COLUMN "thumbnail" SET NOT NULL,
ALTER COLUMN "thumbnail" SET DEFAULT 'null';
