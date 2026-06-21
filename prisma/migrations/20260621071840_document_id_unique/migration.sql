/*
  Warnings:

  - A unique constraint covering the columns `[document_id]` on the table `Documents` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Documents_document_id_key" ON "Documents"("document_id");
