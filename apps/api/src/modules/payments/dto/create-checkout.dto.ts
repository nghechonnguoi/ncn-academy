import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty({ enum: ['pro'] })
  @IsString()
  plan: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  affiliateCode?: string;
}
