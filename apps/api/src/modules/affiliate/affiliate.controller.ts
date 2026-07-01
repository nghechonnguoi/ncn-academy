import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AffiliateService } from './affiliate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Affiliate')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('affiliate')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Get('stats')
  getStats(@Request() req: any) {
    return this.affiliateService.getStats(req.user.id);
  }

  @Get('commissions')
  getCommissions(@Request() req: any, @Query('page') page = '1', @Query('limit') limit = '10') {
    return this.affiliateService.getCommissions(req.user.id, +page, +limit);
  }

  @Post('payout')
  requestPayout(@Request() req: any, @Body() dto: { amount: number; bank: string; account: string }) {
    return this.affiliateService.requestPayout(req.user.id, dto.amount, { bank: dto.bank, account: dto.account });
  }
}
