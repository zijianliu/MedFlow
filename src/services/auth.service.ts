import prisma from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { UserRole, UserStatus } from '../types/enums';

export async function register(
  username: string,
  password: string,
  realName: string,
  role: string = UserRole.PATIENT,
  departmentId?: string,
  idCard?: string,
  phone?: string,
) {
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    throw new BadRequestError('用户名已存在');
  }

  if (password.length < 6) {
    throw new BadRequestError('密码长度至少6位');
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      realName,
      role,
      departmentId,
      idCard,
      phone,
      mustChangePassword: false,
    },
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      departmentId: true,
      createdAt: true,
      mustChangePassword: true,
    },
  });

  const token = signToken({
    userId: user.id,
    role: user.role,
    username: user.username,
  });

  return { token, user };
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw new UnauthorizedError('用户名或密码错误');
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new UnauthorizedError('账号已停用，请联系管理员');
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new UnauthorizedError('用户名或密码错误');
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
    username: user.username,
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role,
      departmentId: user.departmentId,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      departmentId: true,
      phone: true,
      email: true,
      idCard: true,
      employeeNo: true,
      title: true,
      specialties: true,
      bio: true,
      mustChangePassword: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('用户不存在');
  }

  return user;
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });

  if (!user) {
    throw new NotFoundError('用户不存在');
  }

  const isValid = await comparePassword(oldPassword, user.password);
  if (!isValid) {
    throw new BadRequestError('原密码错误');
  }

  if (!newPassword || newPassword.length < 6) {
    throw new BadRequestError('新密码长度至少6位');
  }

  if (oldPassword === newPassword) {
    throw new BadRequestError('新密码不能与原密码相同');
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
      updatedAt: new Date(),
    },
  });

  return { success: true };
}
