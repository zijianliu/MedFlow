"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DOCTOR_PASSWORD = void 0;
exports.listDoctors = listDoctors;
exports.getDoctorById = getDoctorById;
exports.createDoctor = createDoctor;
exports.updateDoctor = updateDoctor;
exports.toggleDoctorStatus = toggleDoctorStatus;
exports.resetDoctorPassword = resetDoctorPassword;
exports.deleteDoctor = deleteDoctor;
exports.checkDoctorActive = checkDoctorActive;
const prisma_1 = __importDefault(require("../utils/prisma"));
const errors_1 = require("../utils/errors");
const enums_1 = require("../types/enums");
const password_1 = require("../utils/password");
exports.DEFAULT_DOCTOR_PASSWORD = 'doctor123';
async function listDoctors(params = {}) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20;
    const skip = (page - 1) * pageSize;
    const where = { role: enums_1.UserRole.DOCTOR };
    if (params.departmentId) {
        where.departmentId = params.departmentId;
    }
    if (params.keyword) {
        where.OR = [
            { realName: { contains: params.keyword } },
            { username: { contains: params.keyword } },
            { employeeNo: { contains: params.keyword } },
        ];
    }
    if (params.status) {
        where.status = params.status;
    }
    else if (!params.includeInactive) {
        where.status = enums_1.UserStatus.ACTIVE;
    }
    const [total, list] = await Promise.all([
        prisma_1.default.user.count({ where }),
        prisma_1.default.user.findMany({
            where,
            skip,
            take: pageSize,
            select: {
                id: true,
                username: true,
                realName: true,
                role: true,
                departmentId: true,
                employeeNo: true,
                title: true,
                phone: true,
                email: true,
                specialties: true,
                bio: true,
                status: true,
                mustChangePassword: true,
                createdAt: true,
                updatedAt: true,
                department: {
                    select: { id: true, name: true, code: true },
                },
                _count: {
                    select: { doctorSchedules: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
    ]);
    return {
        list,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
async function getDoctorById(id) {
    const doctor = await prisma_1.default.user.findFirst({
        where: { id, role: enums_1.UserRole.DOCTOR },
        select: {
            id: true,
            username: true,
            realName: true,
            role: true,
            departmentId: true,
            employeeNo: true,
            title: true,
            phone: true,
            email: true,
            specialties: true,
            bio: true,
            status: true,
            mustChangePassword: true,
            createdAt: true,
            updatedAt: true,
            department: {
                select: { id: true, name: true, code: true },
            },
            _count: {
                select: { doctorSchedules: true },
            },
        },
    });
    if (!doctor) {
        throw new errors_1.NotFoundError('医生不存在');
    }
    return doctor;
}
async function createDoctor(params) {
    if (!params.username || !params.password || !params.realName || !params.departmentId) {
        throw new errors_1.BadRequestError('缺少必填字段：登录账号、初始密码、姓名、所属科室');
    }
    if (params.password.length < 6) {
        throw new errors_1.BadRequestError('密码长度至少6位');
    }
    const department = await prisma_1.default.department.findUnique({
        where: { id: params.departmentId },
        select: { id: true, status: true },
    });
    if (!department) {
        throw new errors_1.BadRequestError('所属科室不存在');
    }
    if (department.status !== enums_1.UserStatus.ACTIVE) {
        throw new errors_1.BadRequestError('所属科室已停用，无法分配医生');
    }
    const existingUser = await prisma_1.default.user.findUnique({
        where: { username: params.username },
    });
    if (existingUser) {
        throw new errors_1.ConflictError('登录账号已存在');
    }
    if (params.employeeNo) {
        const existingEmployeeNo = await prisma_1.default.user.findFirst({
            where: { employeeNo: params.employeeNo },
        });
        if (existingEmployeeNo) {
            throw new errors_1.ConflictError('工号已存在');
        }
    }
    const hashedPassword = await (0, password_1.hashPassword)(params.password);
    return prisma_1.default.user.create({
        data: {
            username: params.username,
            password: hashedPassword,
            realName: params.realName,
            role: enums_1.UserRole.DOCTOR,
            departmentId: params.departmentId,
            employeeNo: params.employeeNo || null,
            title: params.title || null,
            phone: params.phone || null,
            email: params.email || null,
            specialties: params.specialties || null,
            bio: params.bio || null,
            status: params.status || enums_1.UserStatus.ACTIVE,
            mustChangePassword: true,
        },
        select: {
            id: true,
            username: true,
            realName: true,
            role: true,
            departmentId: true,
            employeeNo: true,
            title: true,
            phone: true,
            email: true,
            specialties: true,
            bio: true,
            status: true,
            mustChangePassword: true,
            createdAt: true,
            department: {
                select: { id: true, name: true },
            },
        },
    });
}
async function updateDoctor(id, params) {
    const doctor = await prisma_1.default.user.findFirst({
        where: { id, role: enums_1.UserRole.DOCTOR },
        select: { id: true, departmentId: true },
    });
    if (!doctor) {
        throw new errors_1.NotFoundError('医生不存在');
    }
    if (params.departmentId && params.departmentId !== doctor.departmentId) {
        const department = await prisma_1.default.department.findUnique({
            where: { id: params.departmentId },
            select: { id: true, status: true },
        });
        if (!department) {
            throw new errors_1.BadRequestError('所属科室不存在');
        }
        if (department.status !== enums_1.UserStatus.ACTIVE) {
            throw new errors_1.BadRequestError('所属科室已停用，无法分配医生');
        }
    }
    const data = { updatedAt: new Date() };
    if (params.realName !== undefined)
        data.realName = params.realName;
    if (params.departmentId !== undefined)
        data.departmentId = params.departmentId;
    if (params.title !== undefined)
        data.title = params.title || null;
    if (params.phone !== undefined)
        data.phone = params.phone || null;
    if (params.email !== undefined)
        data.email = params.email || null;
    if (params.specialties !== undefined)
        data.specialties = params.specialties || null;
    if (params.bio !== undefined)
        data.bio = params.bio || null;
    if (params.status !== undefined)
        data.status = params.status;
    return prisma_1.default.user.update({
        where: { id },
        data,
        select: {
            id: true,
            username: true,
            realName: true,
            role: true,
            departmentId: true,
            employeeNo: true,
            title: true,
            phone: true,
            email: true,
            specialties: true,
            bio: true,
            status: true,
            mustChangePassword: true,
            createdAt: true,
            updatedAt: true,
            department: {
                select: { id: true, name: true },
            },
        },
    });
}
async function toggleDoctorStatus(id) {
    const doctor = await prisma_1.default.user.findFirst({
        where: { id, role: enums_1.UserRole.DOCTOR },
        select: { id: true, status: true },
    });
    if (!doctor) {
        throw new errors_1.NotFoundError('医生不存在');
    }
    const newStatus = doctor.status === enums_1.UserStatus.ACTIVE ? enums_1.UserStatus.INACTIVE : enums_1.UserStatus.ACTIVE;
    if (newStatus === enums_1.UserStatus.INACTIVE) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const futureSchedule = await prisma_1.default.schedule.findFirst({
            where: {
                doctorId: id,
                date: { gte: today },
                isCancelled: false,
            },
        });
        if (futureSchedule) {
            throw new errors_1.BadRequestError('该医生存在未完成的排班，请先处理排班后再停用');
        }
    }
    return prisma_1.default.user.update({
        where: { id },
        data: {
            status: newStatus,
            updatedAt: new Date(),
        },
        select: {
            id: true,
            username: true,
            realName: true,
            status: true,
            department: {
                select: { id: true, name: true },
            },
        },
    });
}
async function resetDoctorPassword(id) {
    const doctor = await prisma_1.default.user.findFirst({
        where: { id, role: enums_1.UserRole.DOCTOR },
        select: { id: true },
    });
    if (!doctor) {
        throw new errors_1.NotFoundError('医生不存在');
    }
    const hashedPassword = await (0, password_1.hashPassword)(exports.DEFAULT_DOCTOR_PASSWORD);
    return prisma_1.default.user.update({
        where: { id },
        data: {
            password: hashedPassword,
            mustChangePassword: true,
            updatedAt: new Date(),
        },
        select: {
            id: true,
            username: true,
            realName: true,
            mustChangePassword: true,
        },
    });
}
async function deleteDoctor(id) {
    const doctor = await prisma_1.default.user.findFirst({
        where: { id, role: enums_1.UserRole.DOCTOR },
        select: { id: true, realName: true },
    });
    if (!doctor) {
        throw new errors_1.NotFoundError('医生不存在');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureSchedule = await prisma_1.default.schedule.findFirst({
        where: {
            doctorId: id,
            date: { gte: today },
            isCancelled: false,
        },
    });
    if (futureSchedule) {
        const dateStr = futureSchedule.date.toISOString().split('T')[0];
        throw new errors_1.BadRequestError(`该医生存在未来排班（${dateStr}），无法删除。建议停用医生账号`);
    }
    const pendingVisit = await prisma_1.default.appointment.findFirst({
        where: {
            schedule: { doctorId: id },
            status: {
                in: [
                    enums_1.AppointmentStatus.PENDING_PAYMENT,
                    enums_1.AppointmentStatus.PENDING_VISIT,
                    enums_1.AppointmentStatus.CHECKED_IN,
                    enums_1.AppointmentStatus.IN_VISIT,
                ],
            },
        },
    });
    if (pendingVisit) {
        throw new errors_1.BadRequestError(`该医生存在待就诊的预约记录，无法删除。建议停用医生账号`);
    }
    return prisma_1.default.user.delete({
        where: { id },
        select: {
            id: true,
            username: true,
            realName: true,
        },
    });
}
async function checkDoctorActive(doctorId) {
    const doctor = await prisma_1.default.user.findFirst({
        where: { id: doctorId, role: enums_1.UserRole.DOCTOR },
        select: { status: true },
    });
    return !!doctor && doctor.status === enums_1.UserStatus.ACTIVE;
}
//# sourceMappingURL=doctor.service.js.map