"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDoctors = listDoctors;
exports.getDoctor = getDoctor;
exports.createDoctor = createDoctor;
exports.updateDoctor = updateDoctor;
exports.toggleDoctorStatus = toggleDoctorStatus;
exports.resetDoctorPassword = resetDoctorPassword;
exports.deleteDoctor = deleteDoctor;
const doctorService = __importStar(require("../services/doctor.service"));
async function listDoctors(req, res, next) {
    try {
        const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
        const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
        const { departmentId, keyword, status, includeInactive } = req.query;
        const result = await doctorService.listDoctors({
            page,
            pageSize,
            departmentId: departmentId,
            keyword: keyword,
            status: status,
            includeInactive: includeInactive === 'true',
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
async function getDoctor(req, res, next) {
    try {
        const { id } = req.params;
        const doctor = await doctorService.getDoctorById(id);
        res.json(doctor);
    }
    catch (error) {
        next(error);
    }
}
async function createDoctor(req, res, next) {
    try {
        const { username, password, realName, departmentId, employeeNo, title, phone, email, specialties, bio, status, } = req.body;
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
    }
    catch (error) {
        next(error);
    }
}
async function updateDoctor(req, res, next) {
    try {
        const { id } = req.params;
        const { realName, departmentId, title, phone, email, specialties, bio, status, } = req.body;
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
    }
    catch (error) {
        next(error);
    }
}
async function toggleDoctorStatus(req, res, next) {
    try {
        const { id } = req.params;
        const doctor = await doctorService.toggleDoctorStatus(id);
        res.json(doctor);
    }
    catch (error) {
        next(error);
    }
}
async function resetDoctorPassword(req, res, next) {
    try {
        const { id } = req.params;
        const doctor = await doctorService.resetDoctorPassword(id);
        res.json(doctor);
    }
    catch (error) {
        next(error);
    }
}
async function deleteDoctor(req, res, next) {
    try {
        const { id } = req.params;
        const result = await doctorService.deleteDoctor(id);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=doctor.controller.js.map