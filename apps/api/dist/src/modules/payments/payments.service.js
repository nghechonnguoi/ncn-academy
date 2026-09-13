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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = require("stripe");
const prisma_service_1 = require("../../prisma/prisma.service");
let PaymentsService = class PaymentsService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.stripe = new stripe_1.default(this.config.get('STRIPE_SECRET_KEY'), {
            apiVersion: '2024-06-20',
        });
    }
    async createCheckoutSession(userId, dto) {
        const PRICES = { pro: 299000 };
        const price = PRICES[dto.plan];
        if (!price)
            throw new common_1.BadRequestException('Invalid plan');
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'vnd',
                        product_data: {
                            name: `NCN Academy — Gói ${dto.plan.toUpperCase()}`,
                            description: 'Báo cáo PDF 15 trang + AI Advisor',
                        },
                        unit_amount: price,
                    },
                    quantity: 1,
                },
            ],
            success_url: `${this.config.get('FRONTEND_URL')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${this.config.get('FRONTEND_URL')}/checkout?plan=${dto.plan}`,
            metadata: {
                userId,
                plan: dto.plan,
                affiliateCode: dto.affiliateCode ?? '',
            },
        });
        await this.prisma.payment.create({
            data: {
                userId,
                stripeSessionId: session.id,
                amount: price,
                plan: dto.plan.toUpperCase(),
                status: 'PENDING',
                affiliateCode: dto.affiliateCode,
            },
        });
        return { url: session.url, sessionId: session.id };
    }
    async handleWebhook(rawBody, signature) {
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(rawBody, signature, this.config.get('STRIPE_WEBHOOK_SECRET'));
        }
        catch {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const { userId, plan, affiliateCode } = session.metadata;
            const payment = await this.prisma.payment.update({
                where: { stripeSessionId: session.id },
                data: { status: 'COMPLETED', stripePaymentId: session.payment_intent },
            });
            await this.prisma.user.update({
                where: { id: userId },
                data: { plan: plan.toUpperCase() },
            });
            if (affiliateCode) {
                const affiliate = await this.prisma.user.findUnique({ where: { affiliateCode } });
                if (affiliate) {
                    await this.prisma.affiliateCommission.create({
                        data: {
                            affiliateId: affiliate.id,
                            referredUserId: userId,
                            paymentId: payment.id,
                            amount: Math.round(payment.amount * 0.2),
                            rate: 0.2,
                        },
                    });
                }
            }
        }
        return { received: true };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map