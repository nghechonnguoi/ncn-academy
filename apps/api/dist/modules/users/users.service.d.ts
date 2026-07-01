import { PrismaService } from '../../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number): Promise<{
        data: {
            plan: import(".prisma/client").$Enums.SubscriptionPlan;
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<{
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        affiliateCode: string;
        id: string;
        email: string;
        name: string;
        avatar: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    update(id: string, data: {
        name?: string;
        avatar?: string;
        phone?: string;
    }): Promise<{
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        affiliateCode: string | null;
        id: string;
        email: string;
        googleId: string | null;
        name: string | null;
        password: string | null;
        avatar: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        referredBy: string | null;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(id: string): Promise<{
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        affiliateCode: string | null;
        id: string;
        email: string;
        googleId: string | null;
        name: string | null;
        password: string | null;
        avatar: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        referredBy: string | null;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getDashboardStats(): Promise<{
        totalUsers: number;
        proUsers: number;
        totalRevenue: number;
    }>;
}
