import express, { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import * as momentTimezone from 'moment-timezone';
import {DailyTemperatureStatsRecord, EnrolledDeviceRecord} from "../types";

const router: Router = express.Router();
const prisma = new PrismaClient();

router.get(':deviceId', async (req: Request, res: Response): Promise<Response> => {
  try {
    const deviceId: string = req.params.deviceId;
    const date: string = req.query.date as string;

    const device: EnrolledDeviceRecord = await prisma.device.findUnique({
      where: { id: deviceId }
    }) as EnrolledDeviceRecord;

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const queryDate: string = date ? momentTimezone.tz(date, device.timeZone).format('YYYY-MM-DD') : momentTimezone.tz(device.timeZone).format('YYYY-MM-DD');

    const dailyStats: DailyTemperatureStatsRecord = await prisma.daily_temperature_stats.findUnique({
      where: {
        deviceId_date: {
          deviceId: deviceId,
          date: new Date(queryDate)
        }
      }
    }) as DailyTemperatureStatsRecord;

    if (!dailyStats) {
      return res.status(404).json({ error: 'No data found for the specified date' });
    }

    return res.status(200).json({
      date: dailyStats.date,
      highTemp: dailyStats.highTemp,
      lowTemp: dailyStats.lowTemp,
      avgTemp: dailyStats.avgTemp,
    });
  } catch (error) {
    console.error('Error retrieving daily stats:', error);
    return res.status(500).json({ error: 'An error occurred while retrieving daily stats' });
  }
});

export default router;