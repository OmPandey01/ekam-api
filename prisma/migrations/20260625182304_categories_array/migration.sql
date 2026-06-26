/*
  Warnings:

  - The `categories` column on the `PublishedDocuments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PublishedDocuments" DROP COLUMN "categories",
ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[];
