import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { UserRole, UserStatus, AppointmentStatus } from '../types/enums';
import { hashPassword } from '../utils/password';

export const DEFAULT_DOCTOR_PASSWORD = 'doctor123';

export interface CreateDoctorParams {
  username: string;
  password: string;
  realName: string;
  departmentId: string;
  employeeNo?: string;
  title?: string;
  phone?: string;
  email?: string;
  specialties?: string;
  bio?: string;
  status?: string;
}

export interface UpdateDoctorParams {
  realName?: string;
  departmentId?: string;
  title?: string;
  phone?: string;
  email?: string;
  specialties?: string;
  bio?: string;
  status?: string;
}

export interface ListDoctorsParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  departmentId?: string;
  status?: string;
  includeInactive?: boolean;
}

export async function listDoctors(params: ListDoctorsParams = {}) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20;
  const skip = (page - 1) * pageSize;

  const where: any = { role: UserRole.DOCTOR };

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
  } else if (!params.includeInactive) {
    where.status = UserStatus.ACTIVE;
  }

  const [total, list] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
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

export async function getDoctorById(id: string) {
  const doctor = await prisma.user.findFirst({
    where: { id, role: UserRole.DOCTOR },
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
    throw new NotFoundError('医生不存在');
  }

  return doctor;
}

export async function createDoctor(params: CreateDoctorParams) {
  if (!params.username || !params.password || !params.realName || !params.departmentId) {
    throw new BadRequestError('缺少必填字段：登录账号、初始密码、姓名、所属科室');
  }

  if (params.password.length < 6) {
    throw new BadRequestError('密码长度至少6位');
  }

  const department = await prisma.department.findUnique({
    where: { id: params.departmentId },
    select: { id: true, status: true },
  });

  if (!department) {
    throw new BadRequestError('所属科室不存在');
  }

  if (department.status !== UserStatus.ACTIVE) {
    throw new BadRequestError('所属科室已停用，无法分配医生');
  }

  const existingUser = await prisma.user.findUnique({
    where: { username: params.username },
  });
  if (existingUser) {
    throw new ConflictError('登录账号已存在');
  }

  if (params.employeeNo) {
    const existingEmployeeNo = await prisma.user.findFirst({
      where: { employeeNo: params.employeeNo },
    });
    if (existingEmployeeNo) {
      throw new ConflictError('工号已存在');
    }
  }

  const hashedPassword = await hashPassword(params.password);

  return prisma.user.create({
    data: {
      username: params.username,
      password: hashedPassword,
      realName: params.realName,
      role: UserRole.DOCTOR,
      departmentId: params.departmentId,
      employeeNo: params.employeeNo || null,
      title: params.title || null,
      phone: params.phone || null,
      email: params.email || null,
      specialties: params.specialties || null,
      bio: params.bio || null,
      status: params.status || UserStatus.ACTIVE,
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

export async function updateDoctor(id: string, params: UpdateDoctorParams) {
  const doctor = await prisma.user.findFirst({
    where: { id, role: UserRole.DOCTOR },
    select: { id: true, departmentId: true },
  });

  if (!doctor) {
    throw new NotFoundError('医生不存在');
  }

  if (params.departmentId && params.departmentId !== doctor.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: params.departmentId },
      select: { id: true, status: true },
    });
    if (!department) {
      throw new BadRequestError('所属科室不存在');
    }
    if (department.status !== UserStatus.ACTIVE) {
      throw new BadRequestError('所属科室已停用，无法分配医生');
    }
  }

  const data: any = { updatedAt: new Date() };

  if (params.realName !== undefined) data.realName = params.realName;
  if (params.departmentId !== undefined) data.departmentId = params.departmentId;
  if (params.title !== undefined) data.title = params.title || null;
  if (params.phone !== undefined) data.phone = params.phone || null;
  if (params.email !== undefined) data.email = params.email || null;
  if (params.specialties !== undefined) data.specialties = params.specialties || null;
  if (params.bio !== undefined) data.bio = params.bio || null;
  if (params.status !== undefined) data.status = params.status;

  return prisma.user.update({
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

export async function toggleDoctorStatus(id: string) {
  const doctor = await prisma.user.findFirst({
    where: { id, role: UserRole.DOCTOR },
    select: { id: true, status: true },
  });

  if (!doctor) {
    throw new NotFoundError('医生不存在');
  }

  const newStatus = doctor.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;

  if (newStatus === UserStatus.INACTIVE) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureSchedule = await prisma.schedule.findFirst({
      where: {
        doctorId: id,
        date: { gte: today },
        isCancelled: false,
      },
    });
    if (futureSchedule) {
      throw new BadRequestError('该医生存在未完成的排班，请先处理排班后再停用');
    }
  }

  return prisma.user.update({
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

export async function resetDoctorPassword(id: string) {
  const doctor = await prisma.user.findFirst({
    where: { id, role: UserRole.DOCTOR },
    select: { id: true },
  });

  if (!doctor) {
    throw new NotFoundError('医生不存在');
  }

  const hashedPassword = await hashPassword(DEFAULT_DOCTOR_PASSWORD);

  return prisma.user.update({
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

export async function deleteDoctor(id: string) {
  const doctor = await prisma.user.findFirst({
    where: { id, role: UserRole.DOCTOR },
    select: { id: true, realName: true },
  });

  if (!doctor) {
    throw new NotFoundError('医生不存在');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureSchedule = await prisma.schedule.findFirst({
    where: {
      doctorId: id,
      date: { gte: today },
      isCancelled: false,
    },
  });
  if (futureSchedule) {
    const dateStr = futureSchedule.date.toISOString().split('T')[0];
    throw new BadRequestError(`该医生存在未来排班（${dateStr}），无法删除。建议停用医生账号`);
  }

  const pendingVisit = await prisma.appointment.findFirst({
    where: {
      schedule: { doctorId: id },
      status: {
        in: [
          AppointmentStatus.PENDING_PAYMENT,
          AppointmentStatus.PENDING_VISIT,
          AppointmentStatus.CHECKED_IN,
          AppointmentStatus.IN_VISIT,
        ],
      },
    },
  });
  if (pendingVisit) {
    throw new BadRequestError(`该医生存在待就诊的预约记录，无法删除。建议停用医生账号`);
  }

  return prisma.user.delete({
    where: { id },
    select: {
      id: true,
      username: true,
      realName: true,
    },
  });
}

export async function checkDoctorActive(doctorId: string): Promise<boolean> {
  const doctor = await prisma.user.findFirst({
    where: { id: doctorId, role: UserRole.DOCTOR },
    select: { status: true },
  });
  return !!doctor && doctor.status === UserStatus.ACTIVE;
}
