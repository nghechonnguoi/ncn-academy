declare class AnswerItem {
    questionId: string;
    answer: number | string;
}
export declare class StudentProfileDto {
    fullName: string;
    birthDate: string;
    email: string;
    phone: string;
    favoriteSubjects?: string;
    pastActivities?: string;
    familyOrientation?: string;
    specialTalents?: string;
}
export declare class SubmitAssessmentDto {
    profile?: StudentProfileDto;
    answers: AnswerItem[];
    track?: 'university' | 'vocational';
}
export {};
