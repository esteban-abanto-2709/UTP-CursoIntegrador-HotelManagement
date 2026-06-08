-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "createdBy" INTEGER;

-- CreateIndex
CREATE INDEX "Reservation_createdBy_idx" ON "Reservation"("createdBy");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
