import { consumer, KafkaMessage } from '../kafka';
import { PrismaClient } from '@prisma/client';
import {
  DailyTemperatureStatsDTO,
  DailyTemperatureStatsRecord,
  EnrolledDeviceDTO, EnrolledDeviceRecord,
  TemperatureReadingDTO
} from "../types";
import * as momentTimezone from 'moment-timezone';
import { Moment } from "moment-timezone";

const prisma = new PrismaClient();

export async function processTemperatureReading(message: KafkaMessage): Promise<void> {
  try {
    const data: TemperatureReadingDTO = JSON.parse(message.value?.toString() || '');
    const device: EnrolledDeviceRecord = await prisma.device.findUnique({
      where: { id: data.deviceId }
    }) as EnrolledDeviceRecord;

    if (!device) {
      throw new Error(`Device not found: ${data.deviceId} - reading must come from an enrolled device!`);
    }

    const payload: TemperatureReadingDTO = {
      temperature: data.temperature,
      deviceId: data.deviceId,
      timestamp: new Date(data.timestamp)
    };

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

  // Create a date key that represents the start of the day in UTC
  const utcDateKey: string = deviceTime.clone().utc().startOf('day').format('YYYY-MM-DD');

  const existingStats: DailyTemperatureStatsRecord = await prisma.daily_temperature_stats.findUnique({
    where: {
      deviceId_date: {
        deviceId: device.id,
        date: new Date(utcDateKey)
      }
    }
  }) as DailyTemperatureStatsRecord;

  // Adjust the reading count query to use UTC dates
  const readingCount: number = await prisma.temperature_reading.count({
    where: {
      deviceId: device.id,
      timestamp: {
        gte: new Date(utcDateKey),
        lt: new Date(deviceTime.clone().utc().endOf('day').format())
      }
    }
  });

  if (existingStats) {
    let avgTemp: number;

    if (readingCount === 1) {
      avgTemp = (existingStats.avgTemp + reading.temperature) / 2;
    } else {
      avgTemp = (existingStats.avgTemp * (readingCount - 1) + reading.temperature) / readingCount;
    }

    const payload: Partial<DailyTemperatureStatsDTO> = {
      highTemp: Math.max(existingStats.highTemp, reading.temperature),
      lowTemp: Math.min(existingStats.lowTemp, reading.temperature),
      avgTemp,
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
      date: new Date(utcDateKey), // This will now be the start of the UTC day
      highTemp: reading.temperature,
      lowTemp: reading.temperature,
      avgTemp: reading.temperature,
      deviceId: device.id
    }

    await prisma.daily_temperature_stats.create({ data: payload });
  }
}

export async function startConsumer(): Promise<void> {
  await consumer.connect();
  await consumer.subscribe({ topic: 'temperature-readings', fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ message }: { message: KafkaMessage}): Promise<void> => {
      await processTemperatureReading(message);
    },
  });
}

startConsumer().catch(console.error);