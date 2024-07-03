import { MockPrismaClient } from './types';

const mockPrismaClient: MockPrismaClient = {
  device: { findUnique: jest.fn() },
  daily_temperature_stats: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  temperature_reading: { create: jest.fn(), count: jest.fn() },
};

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

export { mockPrismaClient };