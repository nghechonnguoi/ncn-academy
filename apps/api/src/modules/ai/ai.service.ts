import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../prisma/prisma.service';

const SYSTEM_PROMPT = `Bạn là AI Career Advisor của NCN Academy — hệ thống tư vấn nghề nghiệp hàng đầu Việt Nam.

Nhiệm vụ của bạn:
1. Tư vấn lộ trình sự nghiệp dựa trên kết quả Holland RIASEC và MBTI của người dùng
2. Cung cấp thông tin thị trường lao động Việt Nam 2024-2030 chính xác
3. Gợi ý kỹ năng, chứng chỉ và nguồn học tập cụ thể
4. Phân tích điểm mạnh/yếu và chiến lược phát triển cá nhân

Nguyên tắc:
- Luôn dùng tiếng Việt, ngôn từ chuyên nghiệp nhưng dễ hiểu
- Đưa ra số liệu cụ thể (mức lương, % tăng trưởng ngành)
- Không đưa ra tư vấn mơ hồ chung chung
- Khuyến khích người dùng hành động cụ thể
`;

@Injectable()
export class AiService {
  private openai: OpenAI;
  private readonly FREE_LIMIT = 5;
  private readonly PRO_LIMIT = 50;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({ apiKey: this.config.get('OPENAI_API_KEY') });
  }

  async chat(userId: string, messages: { role: 'user' | 'assistant'; content: string }[]) {
    // Check usage limit
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const limit = user.plan === 'FREE' ? this.FREE_LIMIT : this.PRO_LIMIT;

    const usageCount = await this.prisma.aiUsage.count({
      where: { userId, createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) } },
    });

    if (usageCount >= limit) {
      throw new HttpException(
        `Bạn đã dùng hết ${limit} tin nhắn AI tháng này. Nâng cấp gói để sử dụng thêm.`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // Get user's assessment for context
    const assessment = await this.prisma.assessment.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const systemWithContext = assessment?.riasecResult
      ? `${SYSTEM_PROMPT}\n\nDữ liệu người dùng:\n- Kết quả RIASEC: ${JSON.stringify(assessment.riasecResult)}\n- Top nghề: ${JSON.stringify((assessment.careerResult as any)?.slice(0, 3))}`
      : SYSTEM_PROMPT;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemWithContext },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content ?? '';
    const tokens = completion.usage?.total_tokens ?? 0;
    const cost = (tokens / 1000) * 0.005; // gpt-4o pricing

    // Log usage
    await this.prisma.aiUsage.create({
      data: {
        userId,
        prompt: messages[messages.length - 1].content,
        response: reply,
        tokens,
        cost,
      },
    });

    return { reply, tokensUsed: tokens, remainingMessages: limit - usageCount - 1 };
  }

  async streamChat(userId: string, messages: { role: 'user' | 'assistant'; content: string }[]) {
    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1000,
      stream: true,
    });
    return stream;
  }
}
