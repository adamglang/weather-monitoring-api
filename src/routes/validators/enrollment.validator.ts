import { z } from 'zod';
import { DeviceType } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import {prisma} from "../../app";

// Define the schema based on the EnrollmentRequestDTO interface and Prisma schema
const enrollmentRequestSchema = z.object({
  serial: z.string().min(1),
  type: z.nativeEnum(DeviceType).optional(), // Make type optional as it's not in your example
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Define the schema for the entire request body (single device or array of devices)
const enrollmentBodySchema = z.union([
  enrollmentRequestSchema,
  z.array(enrollmentRequestSchema).min(1),
]).transform((data) => Array.isArray(data) ? data : [data]);

// Validation middleware
export const validateEnrollmentRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = enrollmentBodySchema.parse(req.body);

    // Check for unique serial numbers to fail the request before the db constraint gets hit
    const serialNumbers = validatedData.map(device => device.serial);
    const existingDevices = await prisma.device.findMany({
      where: {
        serial: {
          in: serialNumbers
        }
      },
      select: {
        serial: true
      }
    });

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