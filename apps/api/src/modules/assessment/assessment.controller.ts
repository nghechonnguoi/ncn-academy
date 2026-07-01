import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Assessment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('submit')
  submit(@Request() req: any, @Body() dto: SubmitAssessmentDto) {
    return this.assessmentService.submit(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.assessmentService.getUserAssessments(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.assessmentService.getAssessmentById(id, req.user.id);
  }
}
