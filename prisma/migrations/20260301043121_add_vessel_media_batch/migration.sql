-- AlterTable
ALTER TABLE "Vessel" ADD COLUMN     "mediaBatchId" TEXT;

-- AddForeignKey
ALTER TABLE "Vessel" ADD CONSTRAINT "Vessel_mediaBatchId_fkey" FOREIGN KEY ("mediaBatchId") REFERENCES "MediaBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
