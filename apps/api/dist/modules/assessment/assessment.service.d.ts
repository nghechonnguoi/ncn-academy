import { PrismaService } from '../../prisma/prisma.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
export declare class AssessmentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    submit(userId: string, dto: SubmitAssessmentDto): Promise<{
        assessment: {
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            answers: import("@prisma/client/runtime/library").JsonValue;
            riasecResult: import("@prisma/client/runtime/library").JsonValue | null;
            mbtiResult: import("@prisma/client/runtime/library").JsonValue | null;
            careerResult: import("@prisma/client/runtime/library").JsonValue | null;
            reportUrl: string | null;
        };
        riasecResult: {
            top3: string;
            topCode: string;
            R: number;
            I: number;
            A: number;
            S: number;
            E: number;
            C: number;
        };
        careerResult: {
            pct: number;
            name: string;
            riasec: string;
            salary: string;
            niche: string;
            rank: number;
        }[];
    }>;
    getUserAssessments(userId: string): Promise<{
        id: string;
        createdAt: Date;
        riasecResult: import("@prisma/client/runtime/library").JsonValue;
        careerResult: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    getAssessmentById(id: string, userId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        answers: import("@prisma/client/runtime/library").JsonValue;
        riasecResult: import("@prisma/client/runtime/library").JsonValue | null;
        mbtiResult: import("@prisma/client/runtime/library").JsonValue | null;
        careerResult: import("@prisma/client/runtime/library").JsonValue | null;
        reportUrl: string | null;
    }>;
    private getCategoryForQuestion;
    private matchCareers;
}
