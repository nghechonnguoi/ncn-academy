import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, role: true, plan: true, createdAt: true },
      }),
      this.prisma.user.count(),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, email: true, name: true, avatar: true, role: true, plan: true, affiliateCode: true, createdAt: true },
    });
  }

  async update(id: string, data: { name?: string; avatar?: string; phone?: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async getDashboardStats() {
    const [totalUsers, proUsers, totalRevenue] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { plan: { not: 'FREE' } } }),
      this.prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    ]);
    return { totalUsers, proUsers, totalRevenue: totalRevenue._sum.amount ?? 0 };
  }
}
