import { PrismaService } from '../../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number): Promise<{
        data: {
            id: string;
            createdAt: Date;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            plan: import(".prisma/client").$Enums.SubscriptionPlan;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        email: string;
        affiliateCode: string;
        avatar: string;
        role: import(".prisma/client").$Enums.Role;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
    }>;
    update(id: string, data: {
        name?: string;
        avatar?: string;
        phone?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        name: string | null;
        email: string;
        googleId: string | null;
        affiliateCode: string | null;
        password: string | null;
        avatar: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        referredBy: string | null;
        emailVerified: boolean;
        updatedAt: Date;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string | null;
        email: string;
        googleId: string | null;
        affiliateCode: string | null;
        password: string | null;
        avatar: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        referredBy: string | null;
        emailVerified: boolean;
        updatedAt: Date;
    }>;
    getDashboardStats(): Promise<{
        totalUsers: number;
        proUsers: number;
        totalRevenue: number;
    }>;
}
