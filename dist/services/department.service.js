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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDepartments = listDepartments;
exports.getDepartmentById = getDepartmentById;
exports.listDoctors = listDoctors;
exports.getDoctorById = getDoctorById;
exports.createDepartment = createDepartment;
exports.updateDepartment = updateDepartment;
exports.toggleDepartmentStatus = toggleDepartmentStatus;
const prisma_1 = __importDefault(require("../utils/prisma"));
const errors_1 = require("../utils/errors");
const doctorService = __importStar(require("./doctor.service"));
async function listDepartments(includeInactive = false) {
    const where = {};
    if (!includeInactive) {
        where.status = 'ACTIVE';
    }
    return prisma_1.default.department.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { doctors: true, schedules: true },
            },
        },
    });
}
async function getDepartmentById(id) {
    const dept = await prisma_1.default.department.findUnique({
        where: { id },
        include: {
            _count: {
                select: { doctors: true, schedules: true },
            },
        },
    });
    if (!dept) {
        throw new errors_1.NotFoundError('科室不存在');
    }
    return dept;
}
async function listDoctors(departmentId) {
    const result = await doctorService.listDoctors({
        departmentId,
        includeInactive: true,
    });
    return result.list;
}
async function getDoctorById(id) {
    return doctorService.getDoctorById(id);
}
async function createDepartment(name, code, description) {
    const existing = await prisma_1.default.department.findFirst({
        where: {
            OR: [
                { name },
                ...(code ? [{ code }] : []),
            ],
        },
    });
    if (existing) {
        throw new errors_1.BadRequestError(existing.name === name ? '科室名称已存在' : '科室编码已存在');
    }
    return prisma_1.default.department.create({
        data: { name, code, description, status: 'ACTIVE' },
    });
}
async function updateDepartment(id, data) {
    const dept = await prisma_1.default.department.findUnique({ where: { id } });
    if (!dept) {
        throw new errors_1.NotFoundError('科室不存在');
    }
    if (data.name && data.name !== dept.name) {
        const existing = await prisma_1.default.department.findFirst({ where: { name: data.name, id: { not: id } } });
        if (existing) {
            throw new errors_1.BadRequestError('科室名称已存在');
        }
    }
    if (data.code && data.code !== dept.code) {
        const existing = await prisma_1.default.department.findFirst({ where: { code: data.code, id: { not: id } } });
        if (existing) {
            throw new errors_1.BadRequestError('科室编码已存在');
        }
    }
    return prisma_1.default.department.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.code !== undefined && { code: data.code }),
            ...(data.description !== undefined && { description: data.description }),
        },
    });
}
async function toggleDepartmentStatus(id) {
    const dept = await prisma_1.default.department.findUnique({ where: { id } });
    if (!dept) {
        throw new errors_1.NotFoundError('科室不存在');
    }
    const newStatus = dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return prisma_1.default.department.update({
        where: { id },
        data: { status: newStatus },
    });
}
//# sourceMappingURL=department.service.js.map