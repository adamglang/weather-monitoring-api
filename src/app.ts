import express from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import enrollmentRoutes from './routes/enrollment';
import temperatureReadingRoutes from './routes/temperatureReading';
import dailyStatsRoutes from "./routes/dailyStats";

const app = express();
export const prisma = new PrismaClient();

app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// TODO put routes in a barrel file
app.use('/auth', authRoutes);
app.use('/enrollment', enrollmentRoutes);
app.use('/temperature-reading', temperatureReadingRoutes);
app.use('/daily-stats', dailyStatsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});