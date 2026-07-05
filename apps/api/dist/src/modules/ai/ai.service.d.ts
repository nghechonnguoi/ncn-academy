import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../prisma/prisma.service';
export declare class AiService {
    private readonly prisma;
    private readonly config;
    private openai;
    private readonly FREE_LIMIT;
    private readonly PRO_LIMIT;
    constructor(prisma: PrismaService, config: ConfigService);
    chat(userId: string, messages: {
        role: 'user' | 'assistant';
        content: string;
    }[]): Promise<{
        reply: string;
        tokensUsed: number;
        remainingMessages: number;
    }>;
    streamChat(userId: string, messages: {
        role: 'user' | 'assistant';
        content: string;
    }[]): Promise<import("openai/streaming").Stream<OpenAI.Chat.Completions.ChatCompletionChunk> & {
        _request_id?: string | null;
    }>;
}
