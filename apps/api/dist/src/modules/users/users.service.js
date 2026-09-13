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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async findOne(id) {
        return this.prisma.user.findUniqueOrThrow({
            where: { id },
            select: { id: true, email: true, name: true, avatar: true, role: true, plan: true, affiliateCode: true, createdAt: true },
        });
    }
    async update(id, data) {
        return this.prisma.user.update({ where: { id }, data });
    }
    async delete(id) {
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map