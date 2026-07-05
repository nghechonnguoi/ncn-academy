import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(page?: string, limit?: string): Promise<{
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
    getMe(req: any): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        email: string;
        affiliateCode: string;
        avatar: string;
        role: import(".prisma/client").$Enums.Role;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
    }>;
    updateMe(req: any, dto: {
        name?: string;
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
    remove(id: string): Promise<{
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
}
