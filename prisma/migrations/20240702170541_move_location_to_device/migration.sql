/*
  Warnings:

  - You are about to drop the column `location` on the `temperature_reading` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "device" ADD COLUMN     "location" JSONB;

-- AlterTable
ALTER TABLE "temperature_reading" DROP COLUMN "location";
