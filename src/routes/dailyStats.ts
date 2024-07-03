import express, { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import * as momentTimezone from 'moment-timezone';
import { DailyTemperatureStatsRecord, EnrolledDeviceRecord } from "../types";
import {Moment} from "moment-timezone";

const router: Router = express.Router();
const prisma = new PrismaClient();

router.get('/:deviceId', async (req: Request, res: Response): Promise<Response> => {
  try {
    const deviceId: string = req.params.deviceId;
    const dateQuery: string | undefined = req.query.date as string | undefined;

    const device: EnrolledDeviceRecord = await prisma.device.findUnique({
      where: { id: deviceId }
    }) as EnrolledDeviceRecord;

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    console.log('Device timezone:', device.timeZone);

    let queryDateLocal;

    if (dateQuery) {
      // If a date is provided in the query string, parse it
      const [month, day, year] = dateQuery.split('-').map(Number);
      queryDateLocal = momentTimezone.tz({ year, month: month - 1, day }, device.timeZone).startOf('day');
    } else {
      // If no date is provided, use the current date in the device's timezone
      queryDateLocal = momentTimezone.tz(device.timeZone).startOf('day');
    }

    const queryDateUTC: Moment = queryDateLocal.clone().utc().startOf('day');

    const dailyStats: DailyTemperatureStatsRecord = await prisma.daily_temperature_stats.findFirst({
      where: {
        deviceId: deviceId,
        date: queryDateUTC.toDate()
      }
    }) as DailyTemperatureStatsRecord;

    if (!dailyStats) {
      return res.status(404).json({ error: 'No data found for the specified date' });
    }

    return res.status(200).json({
      date: queryDateLocal.format('YYYY-MM-DD'),
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