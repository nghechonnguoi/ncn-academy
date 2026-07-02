import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ success: false, error: "GEMINI_API_KEY is not set in environment variables." });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Fetch available models
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    const availableModels = data.models ? data.models.map((m: any) => m.name) : [];

    try {
      const result = await model.generateContent("Hello! Please reply with 'Gemini is working!'");
      return NextResponse.json({ success: true, message: result.response.text(), availableModels, keyPrefix: process.env.GEMINI_API_KEY.substring(0, 5) + "..." });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message || "Unknown error", details: String(e), availableModels });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Unknown error", details: String(error) });
  }
}
