import { AssessmentService } from './assessment.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
export declare class AssessmentController {
    private readonly assessmentService;
    constructor(assessmentService: AssessmentService);
    submit(req: any, dto: SubmitAssessmentDto): Promise<{
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
    findAll(req: any): Promise<{
        id: string;
        createdAt: Date;
        riasecResult: import("@prisma/client/runtime/library").JsonValue;
        careerResult: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    findOne(id: string, req: any): Promise<{
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
}
