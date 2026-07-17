import { AffiliateService } from './affiliate.service';
export declare class AffiliateController {
    private readonly affiliateService;
    constructor(affiliateService: AffiliateService);
    getStats(req: any): Promise<{
        affiliateCode: any;
        referralLink: string;
        totalPaid: any;
        pendingAmount: any;
        totalReferrals: any;
    }>;
    getCommissions(req: any, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
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
