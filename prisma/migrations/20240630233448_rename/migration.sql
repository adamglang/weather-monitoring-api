/*
  Warnings:

  - You are about to drop the `Device` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TemperatureReading` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TemperatureReading" DROP CONSTRAINT "TemperatureReading_deviceId_fkey";

-- DropTable
DROP TABLE "Device";

-- DropTable
DROP TABLE "TemperatureReading";

-- CreateTable
CREATE TABLE "device" (
    "id" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "DeviceType" NOT NULL DEFAULT 'weather_monitor',
    "serial" TEXT NOT NULL,

    CONSTRAINT "device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temperature_reading" (
    "id" SERIAL NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" JSONB,
    "deviceId" TEXT NOT NULL,

    CONSTRAINT "temperature_reading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_serial_key" ON "device"("serial");

-- CreateIndex
CREATE INDEX "temperature_reading_deviceId_timestamp_idx" ON "temperature_reading"("deviceId", "timestamp" DESC);

-- AddForeignKey
ALTER TABLE "temperature_reading" ADD CONSTRAINT "temperature_reading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
