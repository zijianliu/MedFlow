import { Request, Response } from 'express';
import * as doctorService from '../services/doctor.service';
import { AuthRequest } from '../middleware/auth';

export async function listDoctors(req: Request, res: Response, next: any) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined;
    const { departmentId, keyword, status, includeInactive } = req.query;

    const result = await doctorService.listDoctors({
      page,
      pageSize,
      departmentId: departmentId as string | undefined,
      keyword: keyword as string | undefined,
      status: status as string | undefined,
      includeInactive: includeInactive === 'true',
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getDoctor(req: Request, res: Response, next: any) {
  try {
    const { id } = req.params;
    const doctor = await doctorService.getDoctorById(id);
    res.json(doctor);
  } catch (error) {
    next(error);
  }
}

export async function createDoctor(req: AuthRequest, res: Response, next: any) {
  try {
    const {
      username,
      password,
      realName,
      departmentId,
      employeeNo,
      title,
      phone,
      email,
      specialties,
      bio,
      status,
    } = req.body;

    const doctor = await doctorService.createDoctor({
      username,
      password,
      realName,
      departmentId,
      employeeNo,
      title,
      phone,
      email,
      specialties,
      bio,
      status,
    });

    res.status(201).json(doctor);
  } catch (error) {
    next(error);
  }
}

export async function updateDoctor(req: AuthRequest, res: Response, next: any) {
  try {
    const { id } = req.params;
    const {
      realName,
      departmentId,
      title,
      phone,
      email,
      specialties,
      bio,
      status,
    } = req.body;

    const doctor = await doctorService.updateDoctor(id, {
      realName,
      departmentId,
      title,
      phone,
      email,
      specialties,
      bio,
      status,
    });

    res.json(doctor);
  } catch (error) {
    next(error);
  }
}

export async function toggleDoctorStatus(req: AuthRequest, res: Response, next: any) {
  try {
    const { id } = req.params;
    const doctor = await doctorService.toggleDoctorStatus(id);
    res.json(doctor);
  } catch (error) {
    next(error);
  }
}

export async function resetDoctorPassword(req: AuthRequest, res: Response, next: any) {
  try {
    const { id } = req.params;
    const doctor = await doctorService.resetDoctorPassword(id);
    res.json(doctor);
  } catch (error) {
    next(error);
  }
}

export async function deleteDoctor(req: AuthRequest, res: Response, next: any) {
  try {
    const { id } = req.params;
    const result = await doctorService.deleteDoctor(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
