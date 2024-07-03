import express, {Request, Response, Router} from 'express';
import { authenticateToken } from '../middleware/auth';
import { producer } from '../kafka';
import {TemperatureReadingDTO} from "../types";
import {validateTemperatureReading} from "./validators/temperatureReading.validator";

const router: Router = express.Router();

router.post('/', authenticateToken, validateTemperatureReading, async (req: Request, res: Response): Promise<Response> => {
  try {
    const { deviceId, temperature }: TemperatureReadingDTO = req.body;

    // Explicitly check for a valid device ID in case the route validation misses it for some reason
    if (!deviceId) return res.status(400).json({ error: 'Invalid input - reading must come from an enrolled device!' });

    await producer.connect();

    await producer.send({
      topic: 'temperature-readings',
      messages: [
        { value: JSON.stringify({ deviceId, temperature, timestamp: new Date().toISOString() }) },
      ],
    });

    return res.status(202).json({ status: 'Message queued for processing' });
  } catch (error: unknown) {
    console.error('Error queuing temperature reading:', error);
    return res.status(500).json({ error: `An error occurred while queuing temperature reading: ${error}` });
  } finally {
    await producer.disconnect();
  }
});

export default router;