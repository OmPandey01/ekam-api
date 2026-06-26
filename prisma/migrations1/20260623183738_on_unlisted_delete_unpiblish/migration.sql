-- DropForeignKey
ALTER TABLE "PublishedDocuments" DROP CONSTRAINT "PublishedDocuments_document_id_fkey";

-- AddForeignKey
ALTER TABLE "PublishedDocuments" ADD CONSTRAINT "PublishedDocuments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
