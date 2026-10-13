-- AlterTable
ALTER TABLE "Media" ADD COLUMN "orderIndex" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Media" ADD COLUMN "responseLimit" INTEGER;

-- AlterTable
ALTER TABLE "Answer" ADD COLUMN "mediaId" TEXT;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
