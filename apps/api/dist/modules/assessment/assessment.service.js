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
exports.AssessmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
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
let AssessmentService = class AssessmentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async submit(userId, dto) {
        const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        for (const { questionId, answer } of dto.answers) {
            const category = this.getCategoryForQuestion(questionId);
            if (category && answer >= 1 && answer <= 5) {
                scores[category] += answer;
            }
        }
        const maxPerCategory = 50;
        const normalized = Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, Math.round((v / maxPerCategory) * 100)]));
        const sorted = Object.entries(normalized).sort(([, a], [, b]) => b - a);
        const top3 = sorted.slice(0, 3).map(([k]) => k).join('');
        const riasecResult = { ...normalized, top3, topCode: sorted[0][0] };
        const careerResult = this.matchCareers(normalized, top3);
        const assessment = await this.prisma.assessment.create({
            data: {
                userId,
                answers: dto.answers,
                riasecResult: riasecResult,
                careerResult: careerResult,
            },
        });
        return { assessment, riasecResult, careerResult };
    }
    async getUserAssessments(userId) {
        return this.prisma.assessment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { id: true, riasecResult: true, careerResult: true, createdAt: true },
        });
    }
    async getAssessmentById(id, userId) {
        return this.prisma.assessment.findFirst({ where: { id, userId } });
    }
    getCategoryForQuestion(questionId) {
        const map = {
            R: 'R', I: 'I', A: 'A', S: 'S', E: 'E', C: 'C',
        };
        const prefix = questionId.charAt(0);
        return map[prefix] ?? null;
    }
    matchCareers(scores, top3) {
        return CAREERS.map((career) => {
            let match = 0;
            for (let i = 0; i < career.riasec.length; i++) {
                const letter = career.riasec[i];
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
};
exports.AssessmentService = AssessmentService;
exports.AssessmentService = AssessmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssessmentService);
//# sourceMappingURL=assessment.service.js.map