import { PrismaService } from '../../prisma/prisma.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
type RiasecKey = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
export declare class AssessmentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    submit(userId: string, dto: SubmitAssessmentDto): Promise<{
        assessment: any;
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
    getUserAssessments(userId: string): Promise<any>;
    getAssessmentById(id: string, userId: string): Promise<any>;
    private calcNumerology;
    private threeRoundMatch;
    private riasecToMbtiHint;
    private buildEngineInput;
    private matchCareers;
    private matchVocationalCareers;
}
export {};
