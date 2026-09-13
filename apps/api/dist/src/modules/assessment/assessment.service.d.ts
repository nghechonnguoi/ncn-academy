import { PrismaService } from '../../prisma/prisma.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
type RiasecKey = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
export declare class AssessmentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    submit(userId: string, dto: SubmitAssessmentDto): Promise<{
        assessment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            answers: import("@prisma/client/runtime/library").JsonValue;
            riasecResult: import("@prisma/client/runtime/library").JsonValue | null;
            mbtiResult: import("@prisma/client/runtime/library").JsonValue | null;
            careerResult: import("@prisma/client/runtime/library").JsonValue | null;
            reportUrl: string | null;
        };
        riasecResult: {
            mbtiCode: string;
            top3: string;
            topCode: RiasecKey;
            R: number;
            I: number;
            A: number;
            S: number;
            E: number;
            C: number;
        };
        careerResult: any[];
        vocationalCareerResult: any[];
        track: "university" | "vocational";
    }>;
    getUserAssessments(userId: string): Promise<{
        id: string;
        createdAt: Date;
        riasecResult: import("@prisma/client/runtime/library").JsonValue;
        careerResult: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    getAssessmentById(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        answers: import("@prisma/client/runtime/library").JsonValue;
        riasecResult: import("@prisma/client/runtime/library").JsonValue | null;
        mbtiResult: import("@prisma/client/runtime/library").JsonValue | null;
        careerResult: import("@prisma/client/runtime/library").JsonValue | null;
        reportUrl: string | null;
    }>;
    private calcNumerology;
    private threeRoundMatch;
    private riasecToMbtiHint;
    private buildEngineInput;
    private matchCareers;
    private matchVocationalCareers;
}
export {};
