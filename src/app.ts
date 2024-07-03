// app.ts or index.ts (whichever is your main file)

import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  authRoutes,
  enrollmentRoutes,
  temperatureReadingRoutes,
  dailyStatsRoutes
} from './routes';

const app = express();
export const prisma = new PrismaClient();

app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.use('/auth', authRoutes);
app.use('/enrollment', enrollmentRoutes);
app.use('/temperature-reading', temperatureReadingRoutes);
app.use('/daily-stats', dailyStatsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});