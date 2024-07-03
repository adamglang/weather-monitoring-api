import request from 'supertest';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
import { mockPrismaClient } from './setupMocks';
import dailyStatsRoutes from '../src/routes/dailyStats';

jest.mock('../src/app', () => {
  const originalModule = jest.requireActual('../src/app');
  return {
    ...originalModule,
    prisma: mockPrismaClient,
  };
});

jest.mock('../src/middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use('/daily-stats', dailyStatsRoutes);

describe('Daily Stats Route', () => {
  const validDeviceId = uuidv4();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve daily stats for a valid device and date', async () => {
    const mockDevice = { id: validDeviceId, timeZone: 'America/New_York' };
    const mockStats = {
      date: new Date('2024-07-03'),
      highTemp: 30,
      lowTemp: 20,
      avgTemp: 25,
    };

    mockPrismaClient.device.findUnique.mockResolvedValue(mockDevice);
    mockPrismaClient.daily_temperature_stats.findFirst.mockResolvedValue(mockStats);

    const response = await request(app)
      .get(`/daily-stats/${validDeviceId}`)
      .query({ date: '07-01-2024' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      date: '2024-07-01',
      highTemp: 30,
      lowTemp: 20,
      avgTemp: 25,
    });
  });

  it('should return 404 for non-existent device', async () => {
    const nonExistentDeviceId = uuidv4();
    mockPrismaClient.device.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .get(`/daily-stats/${nonExistentDeviceId}`)
      .query({ date: '07-01-2024' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Device not found');
  });

  it('should return 404 when no data found for the specified date', async () => {
    const mockDevice = { id: validDeviceId, timeZone: 'America/New_York' };
    mockPrismaClient.device.findUnique.mockResolvedValue(mockDevice);
    mockPrismaClient.daily_temperature_stats.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .get(`/daily-stats/${validDeviceId}`)
      .query({ date: '07-01-2024' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('No data found for the specified date');
  });

  it('should return 400 for invalid date format', async () => {
    const response = await request(app)
      .get(`/daily-stats/${validDeviceId}`)
      .query({ date: 'invalid-date' });

    expect(response.status).toBe(400);
    expect(response.body.error).toStrictEqual([{"code": "invalid_string", "message": "Invalid date format. Use MM-DD-YYYY", "path": ["date"], "validation": "regex"}]
);
  });

  it('should use current date if no date provided', async () => {
    const mockDevice = { id: validDeviceId, timeZone: 'America/New_York' };
    const mockStats = {
      date: new Date(),
      highTemp: 30,
      lowTemp: 20,
      avgTemp: 25,
    };

    mockPrismaClient.device.findUnique.mockResolvedValue(mockDevice);
    mockPrismaClient.daily_temperature_stats.findFirst.mockResolvedValue(mockStats);

    const response = await request(app)
      .get(`/daily-stats/${validDeviceId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('date');
    expect(response.body.highTemp).toBe(30);
    expect(response.body.lowTemp).toBe(20);
    expect(response.body.avgTemp).toBe(25);
  });

  it('should handle future dates correctly', async () => {
    const mockDevice = { id: validDeviceId, timeZone: 'America/New_York' };
    mockPrismaClient.device.findUnique.mockResolvedValue(mockDevice);

    const futureDate = moment().add(1, 'day').format('MM-DD-YYYY');

    const response = await request(app)
      .get(`/daily-stats/${validDeviceId}`)
      .query({ date: futureDate });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Date cannot be in the future');
  });
});
