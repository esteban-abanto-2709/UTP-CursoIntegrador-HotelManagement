-- Renombrar pricePerNight -> rateSnapshot preservando los datos existentes
ALTER TABLE "Reservation" RENAME COLUMN "pricePerNight" TO "rateSnapshot";

-- Nuevos campos de fidelidad (nullable)
ALTER TABLE "Reservation" ADD COLUMN "totalNights" INTEGER;
ALTER TABLE "Reservation" ADD COLUMN "roomTotal" DECIMAL(10,2);

-- Backfill: noches desde las fechas (mínimo 1) y roomTotal = tarifa × noches
UPDATE "Reservation"
SET "totalNights" = GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("checkOut" - "checkIn")) / 86400)),
    "roomTotal"   = COALESCE("rateSnapshot", 0)
                    * GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("checkOut" - "checkIn")) / 86400));
