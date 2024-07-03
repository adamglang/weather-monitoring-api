import request from 'supertest';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { producer } from '../src/kafka';
import { mockPrismaClient } from './setupMocks';
import * as TemperatureProcessor from '../src/processors/temperatureReadingProcessor';
import {KafkaMessage} from "kafkajs";
import temperatureReadingRoutes from '../src/routes/temperatureReading';

jest.mock('../src/middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
}));

jest.mock('../src/kafka', () => ({
  producer: {
    connect: jest.fn(),
    send: jest.fn(),
    disconnect: jest.fn(),
  },
  consumer: {
    connect: jest.fn(),
    subscribe: jest.fn(),
    run: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/temperature-reading', temperatureReadingRoutes);

describe('Temperature Reading Route', () => {
  const validDeviceId = uuidv4();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient.device.findUnique.mockResolvedValue({ id: validDeviceId, timeZone: 'America/New_York' });
    (producer.send as jest.Mock).mockResolvedValue({});
  });

  it('should accept a valid temperature reading and queue it for processing', async () => {
    const response = await request(app)
      .post('/temperature-reading')
      .send({ deviceId: validDeviceId, temperature: 25.5 });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ status: 'Message queued for processing' });
    expect(producer.send).toHaveBeenCalledWith({
      topic: 'temperature-readings',
      messages: [expect.any(Object)],
    });
  });

  it('should return 400 for invalid input', async () => {
    const response = await request(app)
      .post('/temperature-reading')
      .send({ deviceId: validDeviceId, temperature: 'not a number' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 for non-existent device', async () => {
    const nonExistentDeviceId = uuidv4();
    mockPrismaClient.device.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .post('/temperature-reading')
      .send({ deviceId: nonExistentDeviceId, temperature: 25.5 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid input - reading must come from an enrolled device!');
  });

  it('should return 400 for invalid UUID', async () => {
    const response = await request(app)
      .post('/temperature-reading')
      .send({ deviceId: 'not-a-uuid', temperature: 25.5 });

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual([{
      "code": "invalid_string",
      "message": "Invalid device ID format",
      "path": ["deviceId"],
      "validation": "uuid"
    }]);
  });

  it('should return 500 for Kafka errors', async () => {
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    (producer.send as jest.Mock).mockRejectedValue(new Error('Kafka error'));

    const response = await request(app)
      .post('/temperature-reading')
      .send({ deviceId: validDeviceId, temperature: 25.5 });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('An error occurred while queuing temperature reading: Error: Kafka error');
    // Restore console.error
    mockConsoleError.mockRestore();
  });
});

describe('Temperature Reading Processor', () => {
  const validDeviceId = uuidv4();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process a temperature reading message correctly', async () => {
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mockReading = { deviceId: validDeviceId, temperature: 25.5, timestamp: new Date().toISOString() };
    const mockStats = { id: uuidv4(), highTemp: 30, lowTemp: 20, avgTemp: 25 };

    mockPrismaClient.device.findUnique.mockResolvedValue({ id: validDeviceId, timeZone: 'America/New_York' });
    mockPrismaClient.temperature_reading.create.mockResolvedValue(mockReading);
    mockPrismaClient.daily_temperature_stats.findUnique.mockResolvedValue(mockStats);
    mockPrismaClient.daily_temperature_stats.update.mockResolvedValue({ ...mockStats, avgTemp: 25.25 });
    mockPrismaClient.temperature_reading.count.mockResolvedValue(1);

    const mockKafkaMessage: KafkaMessage = {
      key: null,
      value: Buffer.from(JSON.stringify(mockReading)),
      timestamp: '0',
      size: 0,
      attributes: 0,
      offset: '0',
    };

    await TemperatureProcessor.processTemperatureReading(mockKafkaMessage);

    expect(mockPrismaClient.device.findUnique).toHaveBeenCalledWith({ where: { id: validDeviceId } });
    expect(mockPrismaClient.temperature_reading.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        deviceId: validDeviceId,
        temperature: 25.5,
        timestamp: new Date(mockReading.timestamp),
      }),
    });
    expect(mockPrismaClient.daily_temperature_stats.update).toHaveBeenCalled();
    mockConsoleLog.mockRestore();
  });
});