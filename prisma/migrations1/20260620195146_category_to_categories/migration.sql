/*
  Warnings:

  - You are about to drop the column `category` on the `PublishedDocuments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PublishedDocuments" DROP COLUMN "category",
ADD COLUMN     "categories" TEXT NOT NULL DEFAULT 'null';
