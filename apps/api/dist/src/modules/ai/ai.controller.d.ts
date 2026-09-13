import { AiService } from './ai.service';
declare class ChatDto {
    messages: {
        role: 'user' | 'assistant';
        content: string;
    }[];
}
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    chat(req: any, dto: ChatDto): Promise<{
        reply: string;
        tokensUsed: number;
        remainingMessages: number;
    }>;
}
export {};
