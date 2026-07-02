import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        AI_PAGE3_P1: "Điểm sáng rực rỡ nhất ở bạn chính là ngọn lửa nhiệt huyết lan tỏa tự nhiên, khả năng kết nối con người bằng sự chân thành và thấu cảm sâu sắc.",
        AI_PAGE3_P2: "Sự hòa quyện giữa tư duy sáng tạo linh hoạt và trái tim nhân ái mãnh liệt tạo nên một con người vừa giàu ý tưởng đột phá, vừa biết cách hiện thực hóa chúng."
      });
    }

    const userInfo = `- Tên: ${data.HOTEN}
- Nhóm tính cách MBTI: ${data.MBTI}
- Mã Holland: ${data.HOLLAND}
- Điểm Holland: R(${data.R_PCT}%), I(${data.I_PCT}%), A(${data.A_PCT}%), S(${data.S_PCT}%), E(${data.E_PCT}%), C(${data.C_PCT}%)`;

    const instruction = "Bạn là chuyên gia tư vấn hướng nghiệp xuất sắc. Sinh ra BẮT BUỘC một JSON hợp lệ. YÊU CẦU: Viết sâu sắc, đắc nhân tâm, truyền cảm hứng mạnh mẽ. KHÔNG BAO GIỜ gọi tên các chỉ số cụ thể (như MBTI, Holland, %...). Hãy TỔNG HÒA để phân tích dựa trên 'con người thật'.";

    const promptText = `${instruction}
Thông tin ứng viên:
${userInfo}

{
  "AI_PAGE3_P1": "Phân tích tổng quan về điểm sáng nhất trong tính cách của ứng viên (dài ~100 chữ).",
  "AI_PAGE3_P2": "Phân tích về sự kết hợp giữa các đặc điểm nổi trội (dài ~80 chữ)."
}`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    let message;
    let fallbackResult = null;
    try {
      message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1024,
        system: "Bạn chỉ được phép trả về duy nhất một object JSON hợp lệ, không có code blocks, không có text dư thừa.",
        messages: [{ role: "user", content: promptText }]
      });
    } catch (e: any) {
       console.error("Preview API error", e);
       fallbackResult = {
         AI_PAGE3_P1: "Điểm sáng rực rỡ nhất ở bạn chính là ngọn lửa nhiệt huyết lan tỏa tự nhiên, khả năng kết nối con người bằng sự chân thành và thấu cảm sâu sắc.",
         AI_PAGE3_P2: "Sự hòa quyện giữa tư duy sáng tạo linh hoạt và trái tim nhân ái mãnh liệt tạo nên một con người vừa giàu ý tưởng đột phá, vừa biết cách hiện thực hóa chúng."
       }
    }

    if (fallbackResult) {
      return NextResponse.json(fallbackResult);
    }

    let textResult = "";
    if (typeof message.content === 'string') {
      textResult = message.content;
    } else if (Array.isArray(message.content)) {
      const textBlock = message.content.find((b: any) => b.type === 'text') as any;
      textResult = (textBlock && textBlock.text) ? textBlock.text : JSON.stringify(message.content);
    } else {
      textResult = JSON.stringify(message);
    }

    textResult = textResult.replace(/^\s*```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const jsonMatch = textResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      textResult = jsonMatch[0];
    }
    
    return NextResponse.json(JSON.parse(textResult));

  } catch (error: any) {
    console.error("Preview Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, PATCH, DELETE, POST, PUT',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    },
  });
}
