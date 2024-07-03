import express, {Router, Request, Response} from 'express';
import { EnrollmentService } from '../services/enrollment.service';
import {EnrolledDeviceDTO, EnrollmentRequestDTO} from '../types';
import { authenticateToken } from '../middleware/auth';
import {validateEnrollmentRequest} from "./validators/enrollment.validator";

const router: Router = express.Router();

router.post('/', authenticateToken, validateEnrollmentRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const devices: EnrollmentRequestDTO[] = req.body;
    const enrolledDevices: EnrolledDeviceDTO[] = await EnrollmentService.enrollMultipleDevices(devices);
    res.status(201).json(enrolledDevices);
  } catch (error) {
    res.status(500).json({ error: `An error occurred while enrolling devices. Trace: ${error instanceof Error ? error.message : String(error)}` });
  }
});

export default router;