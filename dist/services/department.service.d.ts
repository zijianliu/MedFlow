export declare function listDepartments(includeInactive?: boolean): Promise<({
    _count: {
        doctors: number;
        schedules: number;
    };
} & {
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    code: string | null;
    description: string | null;
})[]>;
export declare function getDepartmentById(id: string): Promise<{
    _count: {
        doctors: number;
        schedules: number;
    };
} & {
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    code: string | null;
    description: string | null;
}>;
export declare function listDoctors(departmentId?: string): Promise<{
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
}[]>;
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
export declare function createDepartment(name: string, code?: string, description?: string): Promise<{
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    code: string | null;
    description: string | null;
}>;
export declare function updateDepartment(id: string, data: {
    name?: string;
    code?: string;
    description?: string;
}): Promise<{
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    code: string | null;
    description: string | null;
}>;
export declare function toggleDepartmentStatus(id: string): Promise<{
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    code: string | null;
    description: string | null;
}>;
//# sourceMappingURL=department.service.d.ts.map