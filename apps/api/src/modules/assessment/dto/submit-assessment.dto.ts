import {
  IsArray, ValidateNested, IsOptional, IsIn,
  IsString, IsNotEmpty, IsNumberString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// ── Answer item: answer có thể là số (Holland/Ikigai talent) hoặc chuỗi (MBTI A/B, Ikigai choice, textarea) ──
class AnswerItem {
  @IsString()
  questionId: string;

  // Chấp nhận number | string — validation mở để hỗ trợ mọi loại câu hỏi
  answer: number | string;
}

// ── Profile học sinh — thu thập ở màn hình 1 ──
export class StudentProfileDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  birthDate: string; // DD/MM/YYYY — dùng tính Nhân số

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  favoriteSubjects?: string; // Môn học yêu thích / năng khiếu (text)

  @IsOptional()
  @IsString()
  pastActivities?: string; // Hoạt động nổi bật

  @IsOptional()
  @IsString()
  familyOrientation?: string; // Định hướng gia đình

  @IsOptional()
  @IsString()
  specialTalents?: string; // Tài năng đặc biệt
}

export class SubmitAssessmentDto {
  @ApiProperty({ description: 'Thông tin học sinh' })
  @IsOptional()
  @ValidateNested()
  @Type(() => StudentProfileDto)
  profile?: StudentProfileDto;

  @ApiProperty({ description: 'Mảng câu trả lời (số hoặc chuỗi)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItem)
  answers: AnswerItem[];

  @ApiProperty({ description: 'Lộ trình học: university | vocational', required: false })
  @IsOptional()
  @IsIn(['university', 'vocational'])
  track?: 'university' | 'vocational';
}
