import { Router } from 'express';
import * as doctorController from '../controllers/doctor.controller';
import * as visitController from '../controllers/visit.controller';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get(
  '/',
  authMiddleware,
  requireRoles(UserRole.ADMIN, UserRole.DEPT_ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  doctorController.listDoctors,
);

router.get(
  '/:id',
  authMiddleware,
  requireRoles(UserRole.ADMIN, UserRole.DEPT_ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  doctorController.getDoctor,
);

router.get(
  '/:id/queue',
  authMiddleware,
  requireRoles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.DEPT_ADMIN),
  visitController.getDoctorQueue,
);

router.post(
  '/',
  authMiddleware,
  requireRoles(UserRole.ADMIN, UserRole.DEPT_ADMIN),
  doctorController.createDoctor,
);

router.put(
  '/:id',
  authMiddleware,
  requireRoles(UserRole.ADMIN, UserRole.DEPT_ADMIN),
  doctorController.updateDoctor,
);

router.patch(
  '/:id/toggle-status',
  authMiddleware,
  requireRoles(UserRole.ADMIN, UserRole.DEPT_ADMIN),
  doctorController.toggleDoctorStatus,
);

router.patch(
  '/:id/reset-password',
  authMiddleware,
  requireRoles(UserRole.ADMIN),
  doctorController.resetDoctorPassword,
);

router.delete(
  '/:id',
  authMiddleware,
  requireRoles(UserRole.ADMIN),
  doctorController.deleteDoctor,
);

export default router;
