import { PrismaService } from '../../prisma/prisma.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
export declare class AssessmentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    submit(userId: string, dto: SubmitAssessmentDto): Promise<{
        assessment: {
            id: string;
            answers: import("@prisma/client/runtime/library").JsonValue;
            riasecResult: import("@prisma/client/runtime/library").JsonValue | null;
            mbtiResult: import("@prisma/client/runtime/library").JsonValue | null;
            careerResult: import("@prisma/client/runtime/library").JsonValue | null;
            reportUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
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
        riasecResult: import("@prisma/client/runtime/library").JsonValue;
        careerResult: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
    }[]>;
    getAssessmentById(id: string, userId: string): Promise<{
        id: string;
        answers: import("@prisma/client/runtime/library").JsonValue;
        riasecResult: import("@prisma/client/runtime/library").JsonValue | null;
        mbtiResult: import("@prisma/client/runtime/library").JsonValue | null;
        careerResult: import("@prisma/client/runtime/library").JsonValue | null;
        reportUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    private getCategoryForQuestion;
    private matchCareers;
}
