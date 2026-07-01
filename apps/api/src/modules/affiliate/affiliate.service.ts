import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AffiliateService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
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

  async getCommissions(userId: string, page = 1, limit = 10) {
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

  async requestPayout(userId: string, amount: number, bankInfo: { bank: string; account: string }) {
    // Create payout request — in production, integrate with bank transfer API
    return { success: true, message: 'Yêu cầu rút tiền đã được ghi nhận. Xử lý trong 1-3 ngày làm việc.' };
  }
}
