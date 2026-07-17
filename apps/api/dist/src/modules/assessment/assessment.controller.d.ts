import { AssessmentService } from './assessment.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
export declare class AssessmentController {
    private readonly assessmentService;
    constructor(assessmentService: AssessmentService);
    submit(req: any, dto: SubmitAssessmentDto): Promise<{
        assessment: any;
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
    findAll(req: any): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
}
