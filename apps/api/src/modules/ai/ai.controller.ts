import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsArray, IsString } from 'class-validator';

class ChatDto {
  @IsArray()
  messages: { role: 'user' | 'assistant'; content: string }[];
}

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  chat(@Request() req: any, @Body() dto: ChatDto) {
    return this.aiService.chat(req.user.id, dto.messages);
  }
}
