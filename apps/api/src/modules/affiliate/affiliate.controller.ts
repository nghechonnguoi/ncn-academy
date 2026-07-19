import { Controller, Get, Post, Body, Query, UseGuards, Request, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AffiliateService } from './affiliate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Affiliate')
@Controller('affiliate')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getStats(@Request() req: any) {
    return this.affiliateService.getStats(req.user.id);
  }

  @Get('commissions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getCommissions(@Request() req: any, @Query('page') page = '1', @Query('limit') limit = '10') {
    return this.affiliateService.getCommissions(req.user.id, +page, +limit);
  }

  @Post('payout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  requestPayout(@Request() req: any, @Body() dto: { amount: number; bank: string; account: string }) {
    return this.affiliateService.requestPayout(req.user.id, dto.amount, { bank: dto.bank, account: dto.account });
  }

  @Post('internal/sepay-sync')
  async syncSePayCommission(
    @Headers('x-internal-secret') secret: string,
    @Body() dto: { referralCode: string; amount: number; customerEmail: string; customerName: string; orderCode: string },
  ) {
    const expectedSecret = process.env.INTERNAL_API_SECRET || 'ncn-internal-secret-2026';
    if (secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid internal secret');
    }
    return this.affiliateService.syncSePayCommission(dto);
  }
}
