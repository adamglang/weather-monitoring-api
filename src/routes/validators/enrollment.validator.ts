import { z } from 'zod';
import { DeviceType } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { prisma } from "../../app";

const enrollmentRequestSchema = z.object({
  serial: z.string().min(1),
  type: z.nativeEnum(DeviceType).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const enrollmentBodySchema = z.array(enrollmentRequestSchema).min(1);

export const validateEnrollmentRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = enrollmentBodySchema.parse(req.body);

    const serialNumbers: string[] = validatedData.map(device => device.serial);
    const existingDevices: { serial: string}[] = await prisma.device.findMany({
      where: {
        serial: {
          in: serialNumbers
        }
      },
      select: {
        serial: true
      }
    }) as Array<{ serial: string }>;;

    if (existingDevices.length > 0) {
      const duplicateSerials = existingDevices.map(device => device.serial);
      return res.status(400).json({
        error: `Devices with the following serial numbers already exist: ${duplicateSerials.join(', ')}`
      });
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