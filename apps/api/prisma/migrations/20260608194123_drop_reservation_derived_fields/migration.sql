/*
  Warnings:

  - You are about to drop the column `roomTotal` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `totalNights` on the `Reservation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "roomTotal",
DROP COLUMN "totalNights";
