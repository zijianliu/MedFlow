export declare const DEFAULT_DOCTOR_PASSWORD = "doctor123";
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
export declare function listDoctors(params?: ListDoctorsParams): Promise<{
    list: {
        id: string;
        username: string;
        employeeNo: string | null;
        realName: string;
        role: string;
        phone: string | null;
        email: string | null;
        departmentId: string | null;
        title: string | null;
        bio: string | null;
        specialties: string | null;
        status: string;
        mustChangePassword: boolean;
        createdAt: Date;
        updatedAt: Date;
        department: {
            id: string;
            name: string;
            code: string | null;
        } | null;
        _count: {
            doctorSchedules: number;
        };
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function getDoctorById(id: string): Promise<{
    id: string;
    username: string;
    employeeNo: string | null;
    realName: string;
    role: string;
    phone: string | null;
    email: string | null;
    departmentId: string | null;
    title: string | null;
    bio: string | null;
    specialties: string | null;
    status: string;
    mustChangePassword: boolean;
    createdAt: Date;
    updatedAt: Date;
    department: {
        id: string;
        name: string;
        code: string | null;
    } | null;
    _count: {
        doctorSchedules: number;
    };
}>;
export declare function createDoctor(params: CreateDoctorParams): Promise<{
    id: string;
    username: string;
    employeeNo: string | null;
    realName: string;
    role: string;
    phone: string | null;
    email: string | null;
    departmentId: string | null;
    title: string | null;
    bio: string | null;
    specialties: string | null;
    status: string;
    mustChangePassword: boolean;
    createdAt: Date;
    department: {
        id: string;
        name: string;
    } | null;
}>;
export declare function updateDoctor(id: string, params: UpdateDoctorParams): Promise<{
    id: string;
    username: string;
    employeeNo: string | null;
    realName: string;
    role: string;
    phone: string | null;
    email: string | null;
    departmentId: string | null;
    title: string | null;
    bio: string | null;
    specialties: string | null;
    status: string;
    mustChangePassword: boolean;
    createdAt: Date;
    updatedAt: Date;
    department: {
        id: string;
        name: string;
    } | null;
}>;
export declare function toggleDoctorStatus(id: string): Promise<{
    id: string;
    username: string;
    realName: string;
    status: string;
    department: {
        id: string;
        name: string;
    } | null;
}>;
export declare function resetDoctorPassword(id: string): Promise<{
    id: string;
    username: string;
    realName: string;
    mustChangePassword: boolean;
}>;
export declare function deleteDoctor(id: string): Promise<{
    id: string;
    username: string;
    realName: string;
}>;
export declare function checkDoctorActive(doctorId: string): Promise<boolean>;
//# sourceMappingURL=doctor.service.d.ts.map