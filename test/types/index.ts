export interface MockPrismaClient {
  device: {
    findUnique: jest.Mock;
  };
  temperature_reading: {
    create: jest.Mock;
    count: jest.Mock;
  };
  daily_temperature_stats: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    findFirst: jest.Mock;
  };
}


    // device: { findUnique: jest.fn() },
    // daily_temperature_stats: {
    // findUnique: jest.fn(),
    //   findFirst: jest.fn(),
    //   create: jest.fn(),
    //   update: jest.fn()
    // },
    // temperature_reading: { create: jest.fn(), count: jest.fn() },