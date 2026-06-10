export declare function register(username: string, password: string, realName: string, role?: string, departmentId?: string, idCard?: string, phone?: string): Promise<{
    token: string;
    user: {
        id: string;
        username: string;
        realName: string;
        role: string;
        departmentId: string | null;
        mustChangePassword: boolean;
        createdAt: Date;
    };
}>;
export declare function login(username: string, password: string): Promise<{
    token: string;
    user: {
        id: string;
        username: string;
        realName: string;
        role: string;
        departmentId: string | null;
        mustChangePassword: boolean;
    };
}>;
export declare function getCurrentUser(userId: string): Promise<{
    id: string;
    username: string;
    employeeNo: string | null;
    realName: string;
    role: string;
    idCard: string | null;
    phone: string | null;
    email: string | null;
    departmentId: string | null;
    title: string | null;
    bio: string | null;
    specialties: string | null;
    mustChangePassword: boolean;
    createdAt: Date;
}>;
export declare function changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{
    success: boolean;
}>;
//# sourceMappingURL=auth.service.d.ts.map