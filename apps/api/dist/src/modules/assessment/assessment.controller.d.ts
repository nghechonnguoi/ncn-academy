import { AssessmentService } from './assessment.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
export declare class AssessmentController {
    private readonly assessmentService;
    constructor(assessmentService: AssessmentService);
    submit(req: any, dto: SubmitAssessmentDto): Promise<{
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
    findAll(req: any): Promise<{
        id: string;
        riasecResult: import("@prisma/client/runtime/library").JsonValue;
        careerResult: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
    }[]>;
    findOne(id: string, req: any): Promise<{
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
}
