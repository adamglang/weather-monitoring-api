import request from 'supertest';
import express from 'express';
import { enrollmentRoutes } from '../src/routes';
import { EnrollmentService } from '../src/services/enrollment.service';
import { prisma } from '../src/app';

const ISO8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

// Mock the authentication middleware
jest.mock('../src/middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
}));

// Mock the EnrollmentService
jest.mock('../src/services/enrollment.service');

// Mock Prisma
jest.mock('../src/app', () => ({
  prisma: {
    device: {
      findMany: jest.fn(),
    },
  },
}));

const app = express();
app.use(express.json());
app.use('/enrollment', enrollmentRoutes);

describe('Enrollment Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should enroll multiple devices successfully', async () => {
    const mockEnrolledDevices = [
      {
        id: 'mock-uuid-1',
        serial: 'TEST001',
        latitude: 40.7128,
        longitude: -74.0060,
        timeZone: 'America/New_York',
        enrolledAt: new Date().toISOString(),
      },
      {
        id: 'mock-uuid-2',
        serial: 'TEST002',
        latitude: 34.0522,
        longitude: -118.2437,
        timeZone: 'America/Los_Angeles',
        enrolledAt: new Date().toISOString(),
      },
    ];

    (EnrollmentService.enrollMultipleDevices as jest.Mock).mockResolvedValue(mockEnrolledDevices);
    (prisma.device.findMany as jest.Mock).mockResolvedValue([]);

    const response = await request(app)
      .post('/enrollment')
      .send([
        { serial: 'TEST001', latitude: 40.7128, longitude: -74.0060 },
        { serial: 'TEST002', latitude: 34.0522, longitude: -118.2437 },
      ]);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.arrayContaining(
        mockEnrolledDevices.map(device => ({
          ...device,
          enrolledAt: expect.stringMatching(ISO8601_REGEX)
        }))
      )
    );
    expect(EnrollmentService.enrollMultipleDevices).toHaveBeenCalledWith([
      { serial: 'TEST001', latitude: 40.7128, longitude: -74.0060 },
      { serial: 'TEST002', latitude: 34.0522, longitude: -118.2437 },
    ]);
  });

  it('should return 400 for invalid input', async () => {
    const response = await request(app)
      .post('/enrollment')
      .send([{ serial: 'TEST001', latitude: 200, longitude: -74.0060 }]);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 for duplicate serial numbers', async () => {
    (prisma.device.findMany as jest.Mock).mockResolvedValue([{ serial: 'TEST001' }]);

    const response = await request(app)
      .post('/enrollment')
      .send([{ serial: 'TEST001', latitude: 40.7128, longitude: -74.0060 }]);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Devices with the following serial numbers already exist');
  });

it('should return 500 for server errors', async () => {
  // Mock console.error for this test
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

  (EnrollmentService.enrollMultipleDevices as jest.Mock).mockRejectedValue(new Error('Database error'));
  (prisma.device.findMany as jest.Mock).mockResolvedValue([]);

  const response = await request(app)
    .post('/enrollment')
    .send([{ serial: 'TEST001', latitude: 40.7128, longitude: -74.0060 }]);

  expect(response.status).toBe(500);
  expect(response.body).toHaveProperty('error');
  expect(response.body.error).toContain('An error occurred while enrolling devices');
  expect(response.body.error).toContain('Database error');

  // Restore console.error
  mockConsoleError.mockRestore();
});
});