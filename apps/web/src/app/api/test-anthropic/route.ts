import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ success: false, error: "ANTHROPIC_API_KEY is not set in environment variables." });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 100,
      messages: [
        { role: "user", content: "Hello! Please reply with 'Anthropic is working!'" }
      ]
    });
    return NextResponse.json({ success: true, message: (message.content[0] as any).text, keyPrefix: process.env.ANTHROPIC_API_KEY.substring(0, 15) + "..." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Unknown error", details: String(error) });
  }
}
