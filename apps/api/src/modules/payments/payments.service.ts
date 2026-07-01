import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
    });
  }

  async createCheckoutSession(userId: string, dto: CreateCheckoutDto) {
    const PRICES: Record<string, number> = { pro: 299000 }; // 299,000 VND — VND is zero-decimal in Stripe
    const price = PRICES[dto.plan];
    if (!price) throw new BadRequestException('Invalid plan');

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
            unit_amount: price, // VND is zero-decimal currency
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

    // Create pending payment record
    await this.prisma.payment.create({
      data: {
        userId,
        stripeSessionId: session.id,
        amount: price, // VND — stored as actual amount
        plan: dto.plan.toUpperCase() as any,
        status: 'PENDING',
        affiliateCode: dto.affiliateCode,
      },
    });

    return { url: session.url, sessionId: session.id };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.config.get('STRIPE_WEBHOOK_SECRET')!,
      );
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, plan, affiliateCode } = session.metadata!;

      // Update payment status
      const payment = await this.prisma.payment.update({
        where: { stripeSessionId: session.id },
        data: { status: 'COMPLETED', stripePaymentId: session.payment_intent as string },
      });

      // Update user plan
      await this.prisma.user.update({
        where: { id: userId },
        data: { plan: plan.toUpperCase() as any },
      });

      // Credit affiliate commission (20%)
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
}
