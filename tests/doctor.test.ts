import prisma from '../src/utils/prisma';
import * as doctorService from '../src/services/doctor.service';
import * as scheduleService from '../src/services/schedule.service';
import * as appointmentService from '../src/services/appointment.service';
import * as authService from '../src/services/auth.service';
import {
  createTestDepartment,
  createTestDoctor,
  createTestPatient,
  createTestUser,
  getTomorrowDateStr,
} from './helpers';
import { UserRole, TimeSlot, AppointmentStatus, UserStatus } from '../src/types/enums';
import { comparePassword } from '../src/utils/password';

describe('Doctor Service', () => {
  let department: any;
  let department2: any;
  let adminUser: any;

  beforeEach(async () => {
    department = await createTestDepartment();
    department2 = await createTestDepartment('测试科室2');
    adminUser = await createTestUser(UserRole.ADMIN);
  });

  describe('createDoctor - 新增医生', () => {
    it('1. 新增医生成功', async () => {
      const result = await doctorService.createDoctor({
        username: 'new_doctor_test',
        password: 'doctor123',
        realName: '新医生',
        departmentId: department.id,
        employeeNo: 'DOC_NEW_001',
        title: '主治医师',
        phone: '13900139001',
        email: 'newdoctor@test.com',
        specialties: '心血管疾病',
        bio: '测试医生简介',
      });

      expect(result).toBeDefined();
      expect(result.username).toBe('new_doctor_test');
      expect(result.realName).toBe('新医生');
      expect(result.role).toBe(UserRole.DOCTOR);
      expect(result.departmentId).toBe(department.id);
      expect(result.employeeNo).toBe('DOC_NEW_001');
      expect(result.title).toBe('主治医师');
      expect(result.phone).toBe('13900139001');
      expect(result.email).toBe('newdoctor@test.com');
      expect(result.specialties).toBe('心血管疾病');
      expect(result.bio).toBe('测试医生简介');
      expect(result.status).toBe(UserStatus.ACTIVE);
      expect(result.mustChangePassword).toBe(true);
      expect(result.department).toBeDefined();
      expect(result.department?.name).toBe(department.name);
    });

    it('2. 工号重复失败', async () => {
      await doctorService.createDoctor({
        username: 'doctor1',
        password: 'doctor123',
        realName: '医生1',
        departmentId: department.id,
        employeeNo: 'DOC_DUP_001',
      });

      await expect(
        doctorService.createDoctor({
          username: 'doctor2',
          password: 'doctor123',
          realName: '医生2',
          departmentId: department.id,
          employeeNo: 'DOC_DUP_001',
        }),
      ).rejects.toThrow('工号已存在');
    });

    it('3. 账号重复失败', async () => {
      await doctorService.createDoctor({
        username: 'dup_username',
        password: 'doctor123',
        realName: '医生1',
        departmentId: department.id,
        employeeNo: 'DOC_DUP_USER_1',
      });

      await expect(
        doctorService.createDoctor({
          username: 'dup_username',
          password: 'doctor123',
          realName: '医生2',
          departmentId: department.id,
          employeeNo: 'DOC_DUP_USER_2',
        }),
      ).rejects.toThrow('登录账号已存在');
    });

    it('科室不存在时新增失败', async () => {
      await expect(
        doctorService.createDoctor({
          username: 'bad_dept_doctor',
          password: 'doctor123',
          realName: '测试医生',
          departmentId: 'non-existent-dept-id',
          employeeNo: 'DOC_BAD_DEPT',
        }),
      ).rejects.toThrow('所属科室不存在');
    });

    it('缺少必填字段失败', async () => {
      await expect(
        doctorService.createDoctor({
          username: '',
          password: 'doctor123',
          realName: '',
          departmentId: '',
        } as any),
      ).rejects.toThrow('缺少必填字段');
    });

    it('密码长度不足失败', async () => {
      await expect(
        doctorService.createDoctor({
          username: 'short_pwd_doctor',
          password: '123',
          realName: '短密码医生',
          departmentId: department.id,
          employeeNo: 'DOC_SHORT_PWD',
        }),
      ).rejects.toThrow('密码长度至少6位');
    });
  });

  describe('updateDoctor - 编辑医生', () => {
    it('4. 编辑医生成功', async () => {
      const doctor = await doctorService.createDoctor({
        username: 'edit_doctor',
        password: 'doctor123',
        realName: '编辑前姓名',
        departmentId: department.id,
        employeeNo: 'DOC_EDIT_001',
        title: '住院医师',
        phone: '13800000001',
        email: 'edit_before@test.com',
        specialties: '普通内科',
        bio: '编辑前简介',
      });

      const updated = await doctorService.updateDoctor(doctor.id, {
        realName: '编辑后姓名',
        departmentId: department2.id,
        title: '主任医师',
        phone: '13800000002',
        email: 'edit_after@test.com',
        specialties: '心血管、糖尿病',
        bio: '编辑后简介',
        status: UserStatus.ACTIVE,
      });

      expect(updated.id).toBe(doctor.id);
      expect(updated.username).toBe('edit_doctor');
      expect(updated.employeeNo).toBe('DOC_EDIT_001');
      expect(updated.realName).toBe('编辑后姓名');
      expect(updated.departmentId).toBe(department2.id);
      expect(updated.title).toBe('主任医师');
      expect(updated.phone).toBe('13800000002');
      expect(updated.email).toBe('edit_after@test.com');
      expect(updated.specialties).toBe('心血管、糖尿病');
      expect(updated.bio).toBe('编辑后简介');
    });

    it('编辑不存在的医生失败', async () => {
      await expect(
        doctorService.updateDoctor('non-existent-doctor-id', {
          realName: '测试',
        }),
      ).rejects.toThrow('医生不存在');
    });
  });

  describe('停用医生后无法排班', () => {
    it('5. 停用医生后无法排班', async () => {
      const doctor = await doctorService.createDoctor({
        username: 'inactive_doctor',
        password: 'doctor123',
        realName: '停用医生',
        departmentId: department.id,
        employeeNo: 'DOC_INACTIVE_001',
      });

      await doctorService.toggleDoctorStatus(doctor.id);

      const checked = await doctorService.getDoctorById(doctor.id);
      expect(checked.status).toBe(UserStatus.INACTIVE);

      const date = getTomorrowDateStr();
      await expect(
        scheduleService.createSchedule(
          doctor.id,
          department.id,
          date,
          TimeSlot.MORNING,
          20,
          100,
          adminUser.id,
          adminUser.role,
        ),
      ).rejects.toThrow('该医生已停用，无法创建排班');
    });
  });

  describe('deleteDoctor - 删除医生', () => {
    it('6. 有未来排班不能删除', async () => {
      const doctor = await doctorService.createDoctor({
        username: 'schedule_doctor',
        password: 'doctor123',
        realName: '有排班医生',
        departmentId: department.id,
        employeeNo: 'DOC_SCHED_001',
      });

      const date = getTomorrowDateStr();
      await scheduleService.createSchedule(
        doctor.id,
        department.id,
        date,
        TimeSlot.MORNING,
        20,
        100,
        adminUser.id,
        adminUser.role,
      );

      await expect(
        doctorService.deleteDoctor(doctor.id),
      ).rejects.toThrow('未来排班');
    });

    it('7. 有待就诊预约不能删除', async () => {
      const doctor = await doctorService.createDoctor({
        username: 'appointment_doctor',
        password: 'doctor123',
        realName: '有预约医生',
        departmentId: department.id,
        employeeNo: 'DOC_APPT_001',
      });

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const pastSchedule = await prisma.schedule.create({
        data: {
          doctorId: doctor.id,
          departmentId: department.id,
          date: yesterday,
          timeSlot: TimeSlot.MORNING,
          maxSlots: 20,
          fee: 100,
        },
      });

      await prisma.slotInventory.create({
        data: {
          scheduleId: pastSchedule.id,
          totalSlots: 20,
          availableSlots: 19,
          bookedSlots: 1,
        },
      });

      const patient = await createTestPatient();
      await prisma.appointment.create({
        data: {
          patientId: patient.id,
          scheduleId: pastSchedule.id,
          departmentId: department.id,
          status: AppointmentStatus.PENDING_VISIT,
          fee: 100,
          patientName: patient.realName,
          patientIdCard: '110101199001015678',
          patientPhone: '13900139000',
        },
      });

      const pendingVisitCount = await prisma.appointment.count({
        where: {
          schedule: { doctorId: doctor.id },
          status: AppointmentStatus.PENDING_VISIT,
        },
      });
      expect(pendingVisitCount).toBe(1);

      const futureScheduleCount = await prisma.schedule.count({
        where: {
          doctorId: doctor.id,
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          isCancelled: false,
        },
      });
      expect(futureScheduleCount).toBe(0);

      await expect(
        doctorService.deleteDoctor(doctor.id),
      ).rejects.toThrow('待就诊的预约记录');
    });

    it('无未来排班和待就诊预约可以删除', async () => {
      const doctor = await doctorService.createDoctor({
        username: 'clean_doctor',
        password: 'doctor123',
        realName: '可删除医生',
        departmentId: department.id,
        employeeNo: 'DOC_CLEAN_001',
      });

      const result = await doctorService.deleteDoctor(doctor.id);
      expect(result.id).toBe(doctor.id);
      expect(result.realName).toBe('可删除医生');

      const deleted = await prisma.user.findUnique({ where: { id: doctor.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('resetDoctorPassword - 重置密码', () => {
    it('8. 重置密码成功', async () => {
      const doctor = await doctorService.createDoctor({
        username: 'reset_pwd_doctor',
        password: 'original123',
        realName: '重置密码医生',
        departmentId: department.id,
        employeeNo: 'DOC_RESET_001',
      });

      const beforeUser = await prisma.user.findUnique({
        where: { id: doctor.id },
        select: { password: true, mustChangePassword: true },
      });
      expect(beforeUser).toBeDefined();

      const loginBefore = await authService.login('reset_pwd_doctor', 'original123');
      expect(loginBefore).toBeDefined();

      const resetResult = await doctorService.resetDoctorPassword(doctor.id);
      expect(resetResult.id).toBe(doctor.id);
      expect(resetResult.mustChangePassword).toBe(true);

      const afterUser = await prisma.user.findUnique({
        where: { id: doctor.id },
        select: { password: true, mustChangePassword: true },
      });
      expect(afterUser).toBeDefined();
      expect(afterUser?.mustChangePassword).toBe(true);

      const isNewPwdValid = await comparePassword('doctor123', afterUser!.password);
      expect(isNewPwdValid).toBe(true);

      const loginAfter = await authService.login('reset_pwd_doctor', 'doctor123');
      expect(loginAfter).toBeDefined();
      expect(loginAfter.user.mustChangePassword).toBe(true);
    });
  });

  describe('listDoctors - 医生列表', () => {
    it('分页查询医生列表', async () => {
      for (let i = 0; i < 5; i++) {
        await doctorService.createDoctor({
          username: `list_doctor_${i}_${Date.now()}`,
          password: 'doctor123',
          realName: `列表医生${i}`,
          departmentId: department.id,
          employeeNo: `DOC_LIST_${i}_${Date.now()}`,
        });
      }

      const result = await doctorService.listDoctors({
        page: 1,
        pageSize: 3,
        includeInactive: true,
      });

      expect(result).toBeDefined();
      expect(result.list).toBeDefined();
      expect(Array.isArray(result.list)).toBe(true);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(3);
      expect(result.total).toBeGreaterThanOrEqual(5);
      expect(result.totalPages).toBeGreaterThanOrEqual(2);
      expect(result.list.length).toBe(3);
    });

    it('按姓名搜索医生', async () => {
      const uniqueName = `唯一搜索名_${Date.now()}`;
      await doctorService.createDoctor({
        username: `search_doctor_${Date.now()}`,
        password: 'doctor123',
        realName: uniqueName,
        departmentId: department.id,
        employeeNo: `DOC_SEARCH_${Date.now()}`,
      });

      const result = await doctorService.listDoctors({
        keyword: uniqueName,
        includeInactive: true,
      });

      expect(result.list.length).toBe(1);
      expect(result.list[0].realName).toBe(uniqueName);
    });

    it('按科室筛选医生', async () => {
      await doctorService.createDoctor({
        username: `dept_filter_${Date.now()}`,
        password: 'doctor123',
        realName: '科室筛选医生',
        departmentId: department2.id,
        employeeNo: `DOC_DEPT_FT_${Date.now()}`,
      });

      const result = await doctorService.listDoctors({
        departmentId: department2.id,
        includeInactive: true,
      });

      expect(result.list.length).toBeGreaterThanOrEqual(1);
      result.list.forEach(d => {
        expect(d.departmentId).toBe(department2.id);
      });
    });

    it('按状态筛选医生', async () => {
      const activeDoctor = await doctorService.createDoctor({
        username: `active_filter_${Date.now()}`,
        password: 'doctor123',
        realName: '启用筛选医生',
        departmentId: department.id,
        employeeNo: `DOC_ACT_FT_${Date.now()}`,
      });

      const inactiveDoctor = await doctorService.createDoctor({
        username: `inactive_filter_${Date.now()}`,
        password: 'doctor123',
        realName: '停用筛选医生',
        departmentId: department.id,
        employeeNo: `DOC_INACT_FT_${Date.now()}`,
      });
      await doctorService.toggleDoctorStatus(inactiveDoctor.id);

      const activeResult = await doctorService.listDoctors({ status: UserStatus.ACTIVE });
      activeResult.list.forEach(d => {
        expect(d.status).toBe(UserStatus.ACTIVE);
      });

      const inactiveResult = await doctorService.listDoctors({ status: UserStatus.INACTIVE });
      expect(inactiveResult.list.length).toBeGreaterThanOrEqual(1);
      inactiveResult.list.forEach(d => {
        expect(d.status).toBe(UserStatus.INACTIVE);
      });
    });
  });

  describe('toggleDoctorStatus - 启停医生', () => {
    it('启用状态切换为停用', async () => {
      const doctor = await doctorService.createDoctor({
        username: `toggle_${Date.now()}`,
        password: 'doctor123',
        realName: '启停测试医生',
        departmentId: department.id,
        employeeNo: `DOC_TOGGLE_${Date.now()}`,
      });

      expect(doctor.status).toBe(UserStatus.ACTIVE);

      const toggled = await doctorService.toggleDoctorStatus(doctor.id);
      expect(toggled.status).toBe(UserStatus.INACTIVE);
    });

    it('停用状态切换为启用', async () => {
      const doctor = await doctorService.createDoctor({
        username: `toggle2_${Date.now()}`,
        password: 'doctor123',
        realName: '启停测试医生2',
        departmentId: department.id,
        employeeNo: `DOC_TOGGLE2_${Date.now()}`,
      });

      await doctorService.toggleDoctorStatus(doctor.id);
      const reactivated = await doctorService.toggleDoctorStatus(doctor.id);
      expect(reactivated.status).toBe(UserStatus.ACTIVE);
    });
  });

  describe('getDoctorById - 查询单个医生', () => {
    it('查询医生详情成功', async () => {
      const created = await doctorService.createDoctor({
        username: `get_by_id_${Date.now()}`,
        password: 'doctor123',
        realName: '查询医生',
        departmentId: department.id,
        employeeNo: `DOC_GET_${Date.now()}`,
        title: '主治医师',
      });

      const found = await doctorService.getDoctorById(created.id);
      expect(found.id).toBe(created.id);
      expect(found.username).toBe(created.username);
      expect(found.realName).toBe(created.realName);
      expect(found.employeeNo).toBe(created.employeeNo);
      expect(found.title).toBe('主治医师');
      expect(found.department).toBeDefined();
      expect(found.department?.id).toBe(department.id);
    });

    it('查询不存在的医生失败', async () => {
      await expect(
        doctorService.getDoctorById('non-existent-id'),
      ).rejects.toThrow('医生不存在');
    });
  });
});
