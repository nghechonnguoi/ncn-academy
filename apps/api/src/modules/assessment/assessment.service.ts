import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';

type RiasecKey = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

const CAREERS = [
  { name: 'Data Analyst', riasec: 'ICR', salary: '15–35 triệu/tháng', niche: 'Business Intelligence' },
  { name: 'Product Manager', riasec: 'EIC', salary: '20–60 triệu/tháng', niche: 'Digital Product' },
  { name: 'UX/UI Designer', riasec: 'AIE', salary: '12–30 triệu/tháng', niche: 'Product Design' },
  { name: 'Software Engineer', riasec: 'IRC', salary: '20–80 triệu/tháng', niche: 'Backend / Frontend' },
  { name: 'Content Strategist', riasec: 'AES', salary: '10–25 triệu/tháng', niche: 'Digital Marketing' },
  { name: 'Business Analyst', riasec: 'IEC', salary: '18–45 triệu/tháng', niche: 'Consulting' },
  { name: 'HR Business Partner', riasec: 'SEA', salary: '15–35 triệu/tháng', niche: 'Talent Management' },
  { name: 'Financial Analyst', riasec: 'ICE', salary: '18–50 triệu/tháng', niche: 'Investment & Banking' },
  { name: 'Marketing Manager', riasec: 'EAS', salary: '20–55 triệu/tháng', niche: 'Brand Strategy' },
  { name: 'Entrepreneur / Founder', riasec: 'EAI', salary: 'Không giới hạn', niche: 'Startup / Business' },
];

@Injectable()
export class AssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(userId: string, dto: SubmitAssessmentDto) {
    // Calculate RIASEC scores
    const scores: Record<RiasecKey, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    for (const { questionId, answer } of dto.answers) {
      const category = this.getCategoryForQuestion(questionId);
      if (category && answer >= 1 && answer <= 5) {
        scores[category] += answer;
      }
    }

    // Normalize to percentages (max 50 per category = 10 questions * 5)
    const maxPerCategory = 50;
    const normalized = Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, Math.round((v / maxPerCategory) * 100)])
    ) as Record<RiasecKey, number>;

    // Get top 3 categories
    const sorted = Object.entries(normalized).sort(([, a], [, b]) => b - a);
    const top3 = sorted.slice(0, 3).map(([k]) => k).join('');

    const riasecResult = { ...normalized, top3, topCode: sorted[0][0] };

    // Match careers
    const careerResult = this.matchCareers(normalized, top3);

    // Save assessment
    const assessment = await this.prisma.assessment.create({
      data: {
        userId,
        answers: dto.answers as any,
        riasecResult: riasecResult as any,
        careerResult: careerResult as any,
      },
    });

    return { assessment, riasecResult, careerResult };
  }

  async getUserAssessments(userId: string) {
    // Reset point: July 5, 2026. Ignore older assessments.
    const resetDate = new Date('2026-07-05T00:00:00.000Z');
    return this.prisma.assessment.findMany({
      where: { 
        userId,
        createdAt: { gte: resetDate }
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, riasecResult: true, careerResult: true, createdAt: true },
    });
  }

  async getAssessmentById(id: string, userId: string) {
    const resetDate = new Date('2026-07-05T00:00:00.000Z');
    return this.prisma.assessment.findFirst({ 
      where: { 
        id, 
        userId,
        createdAt: { gte: resetDate }
      } 
    });
  }

  private getCategoryForQuestion(questionId: string): RiasecKey | null {
    const map: Record<string, RiasecKey> = {
      R: 'R', I: 'I', A: 'A', S: 'S', E: 'E', C: 'C',
    };
    const prefix = questionId.charAt(0);
    return map[prefix] ?? null;
  }

  private matchCareers(scores: Record<RiasecKey, number>, top3: string) {
    return CAREERS.map((career) => {
      let match = 0;
      for (let i = 0; i < career.riasec.length; i++) {
        const letter = career.riasec[i] as RiasecKey;
        const weight = (3 - i) / 3;
        match += (scores[letter] ?? 0) * weight;
      }
      const pct = Math.min(99, Math.round(match / 1.5));
      return { ...career, pct };
    })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5)
      .map((c, i) => ({ rank: i + 1, ...c }));
  }
}
