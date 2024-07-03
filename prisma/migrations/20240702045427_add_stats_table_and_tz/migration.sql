-- AlterTable
ALTER TABLE "device" ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "daily_temperature_stats" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "highTemp" DOUBLE PRECISION NOT NULL,
    "lowTemp" DOUBLE PRECISION NOT NULL,
    "avgTemp" DOUBLE PRECISION NOT NULL,
    "deviceId" TEXT NOT NULL,

    CONSTRAINT "daily_temperature_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_temperature_stats_deviceId_date_key" ON "daily_temperature_stats"("deviceId", "date");

-- AddForeignKey
ALTER TABLE "daily_temperature_stats" ADD CONSTRAINT "daily_temperature_stats_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
