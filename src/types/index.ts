import {DeviceType, Prisma } from '@prisma/client';

export interface EnrollmentRequestDTO {
  serial: string;
  type: DeviceType;
  latitude: number;
  longitude: number;
}

export interface EnrolledDeviceDTO {
  id: string;
  serial: string;
  type: DeviceType;
  enrolledAt: Date;
  latitude: number;
  longitude: number;
  timeZone: string;
}

export interface TemperatureReadingDTO {
  deviceId: string;
  temperature: number;
  timestamp: Date;
}

export interface DailyTemperatureStatsDTO {
    deviceId: string;
    date: Date;
    highTemp: number;
    lowTemp: number;
    avgTemp: number;
}

export type DailyTemperatureStatsRecord = Prisma.daily_temperature_statsGetPayload<NonNullable<unknown>>;
export type EnrolledDeviceRecord = Prisma.deviceGetPayload<NonNullable<unknown>>;
