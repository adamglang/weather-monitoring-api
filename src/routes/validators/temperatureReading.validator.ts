import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const temperatureReadingSchema = z.object({
  deviceId: z.string().uuid("Invalid device ID format"),
  temperature: z.number()
    .min(-273.15, "Temperature cannot be below absolute zero")
    .max(2000, "Temperature is unreasonably high - device should not function above 2000°F"),
});

export const validateTemperatureReading = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = temperatureReadingSchema.parse(req.body);

    // Check if the device exists
    const device = await prisma.device.findUnique({
      where: { id: validatedData.deviceId },
      select: { id: true }
    });

    if (!device) {
      return res.status(400).json({ error: 'Invalid input - reading must come from an enrolled device!' });
    }

    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Validation error:', error);
      res.status(500).json({ error: 'An unexpected error occurred during validation' });
    }
  }
};