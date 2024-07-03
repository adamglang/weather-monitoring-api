import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import momentTimezone from 'moment-timezone';

const dailyStatsParamsSchema = z.object({
  deviceId: z.string().uuid("Invalid device ID format"),
});

const dailyStatsQuerySchema = z.object({
  date: z.string().regex(/^\d{1,2}-\d{1,2}-\d{4}$/, "Invalid date format. Use MM-DD-YYYY").optional(),
});

export const validateDailyStatsRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    dailyStatsParamsSchema.parse(req.params);
    dailyStatsQuerySchema.parse(req.query);

    // Additional date validation
    const dateQuery = req.query.date as string | undefined;
    if (dateQuery) {
      const [month, day, year] = dateQuery.split('-').map(Number);
      const date = momentTimezone(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
      if (!date.isValid()) {
        return res.status(400).json({ error: 'Invalid date' });
      }
      // Optionally, you can check if the date is in the past or within a reasonable range
      if (date.isAfter(momentTimezone())) {
        return res.status(400).json({ error: 'Date cannot be in the future' });
      }
    }

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