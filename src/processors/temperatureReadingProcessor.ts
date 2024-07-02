import { consumer, KafkaMessage } from '../kafka';
import { PrismaClient } from '@prisma/client';
import {
  DailyTemperatureStatsDTO,
  DailyTemperatureStatsRecord,
  EnrolledDeviceDTO, EnrolledDeviceRecord,
  TemperatureReadingDTO
} from "../types";
import * as momentTimezone from 'moment-timezone';
import { Moment} from "moment-timezone";

const prisma = new PrismaClient();

async function processTemperatureReading(message: KafkaMessage): Promise<void> {
  try {
    const data: TemperatureReadingDTO = JSON.parse(message.value?.toString() || '');

    const device: EnrolledDeviceRecord = await prisma.device.findUnique({
      where: { id: data.deviceId }
    }) as EnrolledDeviceRecord;

    if (!device) {
      console.error(`Device not found: ${data.deviceId} - reading must come from an enrolled device!`);
      return;
    }

    const payload: TemperatureReadingDTO = {
      temperature: data.temperature,
      deviceId: data.deviceId,
      timestamp: new Date(data.timestamp)
    }

    await prisma.temperature_reading.create({ data: payload });

    // Update daily stats
    await updateDailyStats(device, payload);

    console.log(`Processed temperature reading for device: ${data.deviceId}`);
  } catch (error) {
    console.error('Error processing message:', error);
  }
}

async function updateDailyStats(device: EnrolledDeviceDTO, reading: TemperatureReadingDTO): Promise<void> {
  const deviceTime: Moment = momentTimezone.tz(reading.timestamp, device.timeZone);
  const dateKey: string = deviceTime.format('YYYY-MM-DD');

  const existingStats: DailyTemperatureStatsRecord = await prisma.daily_temperature_stats.findUnique({
    where: {
      deviceId_date: {
        deviceId: device.id,
        date: new Date(dateKey)
      }
    }
  }) as DailyTemperatureStatsRecord;

  // get length of all temperature readings for the day from the device
  const readingCount: number = await prisma.temperature_reading.count({
    where: {
      deviceId: device.id,
      timestamp: {
        gte: new Date(dateKey),
        lt: new Date(dateKey + 'T23:59:59.999Z')
      }
    }
  });

  if (existingStats) {
    // Use type assertion here
    const payload: Partial<DailyTemperatureStatsDTO> = {
      highTemp: Math.max(existingStats.highTemp, reading.temperature),
      lowTemp: Math.min(existingStats.lowTemp, reading.temperature),
      avgTemp: (existingStats.avgTemp * readingCount + reading.temperature) / (readingCount + 1),
    }

    // Update existing stats
    await prisma.daily_temperature_stats.update({
      where: {
        id: existingStats.id
      },
      data: payload
    });
  } else {
    // Create new stats
    const payload: DailyTemperatureStatsDTO = {
      date: new Date(dateKey),
      highTemp: reading.temperature,
      lowTemp: reading.temperature,
      avgTemp: reading.temperature,
      deviceId: device.id
    }

    await prisma.daily_temperature_stats.create({ data: payload });
  }
}


async function startConsumer(): Promise<void> {
  await consumer.connect();
  await consumer.subscribe({ topic: 'temperature-readings', fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ message }: { message: KafkaMessage}): Promise<void> => {
      await processTemperatureReading(message);
    },
  });
}

startConsumer().catch(console.error);