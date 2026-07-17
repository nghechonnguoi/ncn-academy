import { PrismaService } from '../../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, data: {
        name?: string;
        avatar?: string;
        phone?: string;
    }): Promise<any>;
    delete(id: string): Promise<any>;
    getDashboardStats(): Promise<{
        totalUsers: any;
        proUsers: any;
        totalRevenue: any;
    }>;
}
