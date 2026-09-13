import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Assessment')
@ApiBearerAuth()
@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  // Submit không cần đăng nhập — guest mode
  @Post('submit')
  @UseGuards(OptionalJwtAuthGuard)
  submit(@Request() req: any, @Body() dto: SubmitAssessmentDto) {
    const userId: string | null = req.user?.id ?? null;
    return this.assessmentService.submit(userId, dto);
  }

  // Các route còn lại vẫn cần JWT
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req: any) {
    return this.assessmentService.getUserAssessments(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.assessmentService.getAssessmentById(id, req.user.id);
  }
}
