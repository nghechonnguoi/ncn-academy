import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
export declare class PaymentsService {
    private readonly prisma;
    private readonly config;
    private stripe;
    constructor(prisma: PrismaService, config: ConfigService);
    createCheckoutSession(userId: string, dto: CreateCheckoutDto): Promise<{
        url: string;
        sessionId: string;
    }>;
    handleWebhook(rawBody: Buffer, signature: string): Promise<{
        received: boolean;
    }>;
}
