import { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import type { Request as ExpressRequest } from 'express';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createCheckout(req: any, dto: CreateCheckoutDto): Promise<{
        url: string;
        sessionId: string;
    }>;
    handleWebhook(req: RawBodyRequest<ExpressRequest>, sig: string): Promise<{
        received: boolean;
    }>;
}
