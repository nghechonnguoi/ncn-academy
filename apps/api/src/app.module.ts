import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AffiliateModule } from './modules/affiliate/affiliate.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  controllers: [AppController],
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    // Core
    PrismaModule,
    // Feature modules
    AuthModule,
    UsersModule,
    AssessmentModule,
    PaymentsModule,
    AffiliateModule,
    AiModule,
  ],
})
export class AppModule {}
