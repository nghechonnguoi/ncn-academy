import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ success: false, error: "ANTHROPIC_API_KEY is not set in environment variables." });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const modelsToTry = [
      "claude-5-sonnet",
      "claude-5-sonnet-latest",
      "claude-5-sonnet-20260415",
      "claude-sonnet-5",
      "sonnet-5",
      "claude-3-5-sonnet-20240620",
      "claude-3-5-sonnet-latest"
    ];
    
    let results: any = {};
    for (const modelName of modelsToTry) {
      try {
        const msg = await anthropic.messages.create({
          model: modelName,
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }]
        });
        results[modelName] = "SUCCESS: " + (msg.content[0] as any).text;
      } catch (err: any) {
        results[modelName] = "FAILED: " + err.message;
      }
    }
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Unknown error" });
  }
}
