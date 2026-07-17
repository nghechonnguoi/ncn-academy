"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
const prisma_service_1 = require("../../prisma/prisma.service");
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
let AiService = class AiService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.FREE_LIMIT = 5;
        this.PRO_LIMIT = 50;
        this.openai = new openai_1.default({ apiKey: this.config.get('OPENAI_API_KEY') });
    }
    async chat(userId, messages) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const limit = user.plan === 'FREE' ? this.FREE_LIMIT : this.PRO_LIMIT;
        const usageCount = await this.prisma.aiUsage.count({
            where: { userId, createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) } },
        });
        if (usageCount >= limit) {
            throw new common_1.HttpException(`Bạn đã dùng hết ${limit} tin nhắn AI tháng này. Nâng cấp gói để sử dụng thêm.`, common_1.HttpStatus.PAYMENT_REQUIRED);
        }
        const assessment = await this.prisma.assessment.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        const systemWithContext = assessment?.riasecResult
            ? `${SYSTEM_PROMPT}\n\nDữ liệu người dùng:\n- Kết quả RIASEC: ${JSON.stringify(assessment.riasecResult)}\n- Top nghề: ${JSON.stringify(assessment.careerResult?.slice(0, 3))}`
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
        const cost = (tokens / 1000) * 0.005;
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
    async streamChat(userId, messages) {
        const stream = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
            max_tokens: 1000,
            stream: true,
        });
        return stream;
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map