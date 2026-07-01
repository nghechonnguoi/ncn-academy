import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(page?: string, limit?: string): Promise<{
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
    getMe(req: any): Promise<{
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        affiliateCode: string;
        id: string;
        email: string;
        name: string;
        avatar: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    updateMe(req: any, dto: {
        name?: string;
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
    remove(id: string): Promise<{
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
}
