import { AssessmentService } from './assessment.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
export declare class AssessmentController {
    private readonly assessmentService;
    constructor(assessmentService: AssessmentService);
    submit(req: any, dto: SubmitAssessmentDto): Promise<{
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
            topCode: "R" | "I" | "A" | "S" | "E" | "C";
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
    findAll(req: any): Promise<{
        id: string;
        createdAt: Date;
        riasecResult: import("@prisma/client/runtime/library").JsonValue;
        careerResult: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    findOne(id: string, req: any): Promise<{
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
}
