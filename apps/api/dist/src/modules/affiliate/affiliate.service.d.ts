import { PrismaService } from '../../prisma/prisma.service';
export declare class AffiliateService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(userId: string): Promise<{
        affiliateCode: any;
        referralLink: string;
        totalPaid: any;
        pendingAmount: any;
        totalReferrals: any;
    }>;
    getCommissions(userId: string, page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    requestPayout(userId: string, amount: number, bankInfo: {
        bank: string;
        account: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
