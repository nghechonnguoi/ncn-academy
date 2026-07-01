import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max } from 'class-validator';

class AnswerItem {
  @IsString()
  questionId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  answer: number;
}

export class SubmitAssessmentDto {
  @ApiProperty({ description: 'Array of question answers (1–5 scale)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItem)
  answers: AnswerItem[];
}
