-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomCharge" (
    "id" SERIAL NOT NULL,
    "reservationId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "registeredBy" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "chargedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- CreateIndex
CREATE INDEX "RoomCharge_reservationId_idx" ON "RoomCharge"("reservationId");

-- CreateIndex
CREATE INDEX "RoomCharge_categoryId_idx" ON "RoomCharge"("categoryId");

-- CreateIndex
CREATE INDEX "RoomCharge_registeredBy_idx" ON "RoomCharge"("registeredBy");

-- AddForeignKey
ALTER TABLE "RoomCharge" ADD CONSTRAINT "RoomCharge_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomCharge" ADD CONSTRAINT "RoomCharge_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomCharge" ADD CONSTRAINT "RoomCharge_registeredBy_fkey" FOREIGN KEY ("registeredBy") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
