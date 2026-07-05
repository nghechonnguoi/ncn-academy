import { AffiliateService } from './affiliate.service';
export declare class AffiliateController {
    private readonly affiliateService;
    constructor(affiliateService: AffiliateService);
    getStats(req: any): Promise<{
        affiliateCode: string;
        referralLink: string;
        totalPaid: number;
        pendingAmount: number;
        totalReferrals: number;
    }>;
    getCommissions(req: any, page?: string, limit?: string): Promise<{
        data: ({
            payment: {
                plan: import(".prisma/client").$Enums.SubscriptionPlan;
                amount: number;
            };
            referredUser: {
                name: string;
                email: string;
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
    requestPayout(req: any, dto: {
        amount: number;
        bank: string;
        account: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
