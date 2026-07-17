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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = require("bcrypt");
const nanoid_1 = require("nanoid");
let AuthService = class AuthService {
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    async register(dto) {
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists)
            throw new common_1.ConflictException('Email đã được sử dụng');
        const hashed = await bcrypt.hash(dto.password, 12);
        const affiliateCode = (0, nanoid_1.nanoid)(10).toUpperCase();
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                password: hashed,
                affiliateCode,
                referredBy: dto.referralCode ?? null,
            },
            select: { id: true, email: true, name: true, role: true, plan: true, affiliateCode: true },
        });
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        return { user, ...tokens };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user || !user.password)
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không đúng');
        const valid = await bcrypt.compare(dto.password, user.password);
        if (!valid)
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không đúng');
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        return {
            user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan },
            ...tokens,
        };
    }
    async googleAuth(idToken) {
        throw new common_1.ForbiddenException('Google auth not yet configured');
    }
    async refreshToken(token) {
        const stored = await this.prisma.refreshToken.findUnique({ where: { token } });
        if (!stored || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
        }
        const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
        if (!user)
            throw new common_1.UnauthorizedException('Người dùng không tồn tại');
        await this.prisma.refreshToken.delete({ where: { token } });
        return this.generateTokens(user.id, user.email, user.role);
    }
    async logout(userId) {
        await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
    async generateTokens(userId, email, role) {
        const payload = { sub: userId, email, role };
        const accessToken = this.jwt.sign(payload, {
            secret: this.config.get('JWT_SECRET'),
            expiresIn: '15m',
        });
        const refreshToken = (0, nanoid_1.nanoid)(64);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await this.prisma.refreshToken.create({
            data: { userId, token: refreshToken, expiresAt },
        });
        return { accessToken, refreshToken, expiresIn: 900 };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map