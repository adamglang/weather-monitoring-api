import express, {Router, Request, Response} from 'express';
import { EnrollmentService } from '../services/enrollment.service';
import {EnrolledDeviceDTO, EnrollmentRequestDTO} from '../types';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const devices: EnrollmentRequestDTO | EnrollmentRequestDTO[] = req.body;

    if (Array.isArray(devices)) {
      const enrolledDevices: EnrolledDeviceDTO[] = await EnrollmentService.enrollMultipleDevices(devices);
      res.status(201).json(enrolledDevices);
    } else {
      const enrolledDevice: EnrolledDeviceDTO = await EnrollmentService.enrollDevice(devices);
      res.status(201).json(enrolledDevice);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `An error occurred while enrolling devices. Trace: ${error}` });
  }
});

export default router;