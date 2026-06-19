/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Reservation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_createdBy_fkey";

-- DropIndex
DROP INDEX "Reservation_createdBy_idx";

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "createdBy";
