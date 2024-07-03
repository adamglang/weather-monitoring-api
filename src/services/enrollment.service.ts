import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../app';
import { EnrollmentRequestDTO, EnrolledDeviceRecord } from '../types';
import { find } from 'geo-tz';
import { Prisma } from '@prisma/client';

export class EnrollmentService {
  static async enrollDevice(deviceData: EnrollmentRequestDTO): Promise<EnrolledDeviceRecord> {
    const timeZone: string = find(deviceData.latitude, deviceData.longitude)[0] || 'UTC';

    const payload: Prisma.deviceCreateInput = {
        serial: deviceData.serial,
        latitude: deviceData.latitude,
        timeZone: timeZone,
        longitude: deviceData.longitude,
        id: uuidv4(),
        enrolledAt: new Date(),
    };

    return prisma.device.create({ data: payload });
  }

  static async enrollMultipleDevices(devicesData: EnrollmentRequestDTO[]): Promise<EnrolledDeviceRecord[]> {
    return Promise.all(
      devicesData.map((deviceData: EnrollmentRequestDTO) => this.enrollDevice(deviceData))
    );
  }
}