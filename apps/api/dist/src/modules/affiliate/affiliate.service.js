"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AffiliateService = class AffiliateService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats(userId) {
        const [totalCommission, pendingCommission, referrals] = await Promise.all([
            this.prisma.affiliateCommission.aggregate({
                where: { affiliateId: userId, status: 'PAID' },
                _sum: { amount: true },
            }),
            this.prisma.affiliateCommission.aggregate({
                where: { affiliateId: userId, status: 'PENDING' },
                _sum: { amount: true },
            }),
            this.prisma.affiliateCommission.count({ where: { affiliateId: userId } }),
        ]);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { affiliateCode: true },
        });
        return {
            affiliateCode: user?.affiliateCode,
            referralLink: `https://nghechonnguoi.com/ref/${user?.affiliateCode}`,
            totalPaid: totalCommission._sum.amount ?? 0,
            pendingAmount: pendingCommission._sum.amount ?? 0,
            totalReferrals: referrals,
        };
    }
    async getCommissions(userId, page = 1, limit = 10) {
        const [data, total] = await Promise.all([
            this.prisma.affiliateCommission.findMany({
                where: { affiliateId: userId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    referredUser: { select: { name: true, email: true } },
                    payment: { select: { amount: true, plan: true } },
                },
            }),
            this.prisma.affiliateCommission.count({ where: { affiliateId: userId } }),
        ]);
        return { data, total, page, limit };
    }
    async requestPayout(userId, amount, bankInfo) {
        return { success: true, message: 'Yêu cầu rút tiền đã được ghi nhận. Xử lý trong 1-3 ngày làm việc.' };
    }
};
exports.AffiliateService = AffiliateService;
exports.AffiliateService = AffiliateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AffiliateService);
//# sourceMappingURL=affiliate.service.js.map