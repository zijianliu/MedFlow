import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function listDoctors(req: Request, res: Response, next: any): Promise<void>;
export declare function getDoctor(req: Request, res: Response, next: any): Promise<void>;
export declare function createDoctor(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function updateDoctor(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function toggleDoctorStatus(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function resetDoctorPassword(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function deleteDoctor(req: AuthRequest, res: Response, next: any): Promise<void>;
//# sourceMappingURL=doctor.controller.d.ts.map