import { PrismaService } from '../../prisma/prisma.service';
export declare class AffiliateService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(userId: string): Promise<{
        affiliateCode: string;
        referralLink: string;
        totalPaid: number;
        pendingAmount: number;
        totalReferrals: number;
    }>;
    getCommissions(userId: string, page?: number, limit?: number): Promise<{
        data: ({
            payment: {
                plan: import(".prisma/client").$Enums.SubscriptionPlan;
                amount: number;
            };
            referredUser: {
                email: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            amount: number;
            status: import(".prisma/client").$Enums.CommissionStatus;
            rate: number;
            paidAt: Date | null;
            affiliateId: string;
            referredUserId: string;
            paymentId: string;
        })[];
        total: number;
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
