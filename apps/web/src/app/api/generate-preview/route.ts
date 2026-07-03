import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        AI_PAGE3_P1: "Điểm sáng rực rỡ nhất ở bạn chính là ngọn lửa nhiệt huyết lan tỏa tự nhiên, khả năng kết nối con người bằng sự chân thành và thấu cảm sâu sắc.",
        AI_PAGE3_P2: "Sự hòa quyện giữa tư duy sáng tạo linh hoạt và trái tim nhân ái mãnh liệt tạo nên một con người vừa giàu ý tưởng đột phá, vừa biết cách hiện thực hóa chúng.",
        AI_PAGE3_P3: "Bạn sẽ tỏa sáng nhất trong môi trường năng động, đề cao giá trị con người, nơi bạn được tự do sáng tạo, giao tiếp cởi mở."
      });
    }

    const userInfo = `- Tên: ${data.HOTEN}
- Nhóm tính cách MBTI: ${data.MBTI}
- Mã Holland: ${data.HOLLAND}
- Điểm Holland: R(${data.R_PCT}%), I(${data.I_PCT}%), A(${data.A_PCT}%), S(${data.S_PCT}%), E(${data.E_PCT}%), C(${data.C_PCT}%)
- Tiềm năng bẩm sinh (Life Path): ${data.LIFEPATH || "Không có"}
- Khao khát nội tại (Soul): ${data.SOUL || "Không có"}
- Số Sứ mệnh (Mission): ${data.MISSION || "Không có"}
- Chỉ số Tài năng (Talent): ${data.TALENT || "Không có"}
- Chỉ số Đam mê (Passion): ${data.PASSION || "Không có"}`;

    const instruction = "Bạn là chuyên gia tư vấn hướng nghiệp xuất sắc. Sinh ra BẮT BUỘC một JSON hợp lệ. YÊU CẦU QUAN TRỌNG: 1. Viết thật sâu sắc, đắc nhân tâm, truyền cảm hứng mạnh mẽ. 2. LUÔN LỒNG GHÉP VÀ TỔNG HÒA ý nghĩa của 5 khía cạnh cốt lõi (Tiềm năng bẩm sinh, Khao khát nội tại, Sứ mệnh, Tài năng, Đam mê) cùng với MBTI và Holland vào bài viết. 3. KHÔNG BAO GIỜ gọi đích danh tên các chỉ số (như MBTI, Holland, Số chủ đạo...). Hãy biến chúng thành những phẩm chất cá nhân chân thật.";

    const promptText = `${instruction}
Thông tin ứng viên:
${userInfo}

{
  "AI_PAGE3_P1": "Phân tích tổng quan về điểm sáng nhất trong tính cách của ứng viên (dài ~100 chữ).",
  "AI_PAGE3_P2": "Phân tích về sự kết hợp giữa các đặc điểm nổi trội (dài ~80 chữ).",
  "AI_PAGE3_P3": "Dự đoán môi trường làm việc (tương tác, văn hóa, không gian) giúp ứng viên tỏa sáng và phát huy tối đa năng lực nhất (dài ~50 chữ)."
}`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    let message: any;
    let fallbackResult = null;
    let errorMessage = "";
    
    const modelsToTry = [
      "claude-3-5-sonnet-latest",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-latest",
      "claude-3-5-haiku-20241022",
      "claude-3-haiku-20240307"
    ];

    let errors = [];
    for (const modelName of modelsToTry) {
      try {
        message = await anthropic.messages.create({
          model: modelName,
          max_tokens: 1024,
          system: "Bạn chỉ được phép trả về duy nhất một object JSON hợp lệ, không có code blocks, không có text dư thừa. TUYỆT ĐỐI KHÔNG DÙNG KÝ TỰ XUỐNG DÒNG (ENTER) BÊN TRONG CHUỖI GIÁ TRỊ JSON.",
          messages: [{ role: "user", content: promptText }]
        });
        break; // Stop trying if successful
      } catch (err: any) {
        errors.push(`${modelName}: ${err.message}`);
      }
    }

    if (!message) {
      if (process.env.GEMINI_API_KEY) {
        console.log("Anthropic failed, falling back to Gemini...");
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        const geminiModelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash"];
        let result;
        let geminiError;
        
        for (const gModel of geminiModelsToTry) {
          try {
            const model = genAI.getGenerativeModel({ model: gModel });
            result = await model.generateContent(
              "Bạn chỉ được phép trả về duy nhất một object JSON hợp lệ, không có code blocks, không có text dư thừa. TUYỆT ĐỐI KHÔNG DÙNG KÝ TỰ XUỐNG DÒNG (ENTER) BÊN TRONG CHUỖI GIÁ TRỊ JSON.\n\n" + promptText
            );
            break;
          } catch (err: any) {
            geminiError = err;
          }
        }
        
        if (!result) {
          errorMessage = errors.join(" | ") + " | Gemini: " + (geminiError?.message || "Unknown error");
          console.error("Preview API all models failed", errorMessage);
          fallbackResult = {
            AI_PAGE3_P1: `[AI Error: ${errorMessage}] Điểm sáng rực rỡ nhất ở bạn chính là ngọn lửa nhiệt huyết lan tỏa tự nhiên, khả năng kết nối con người bằng sự chân thành và thấu cảm sâu sắc.`,
            AI_PAGE3_P2: "Sự hòa quyện giữa tư duy sáng tạo linh hoạt và trái tim nhân ái mãnh liệt tạo nên một con người vừa giàu ý tưởng đột phá, vừa biết cách hiện thực hóa chúng."
          };
        } else {
          const response = await result.response;
          message = { content: response.text() };
        }
      } else {
        errorMessage = errors.join(" | ");
        console.error("Preview API all models failed", errorMessage);
        fallbackResult = {
          AI_PAGE3_P1: `[AI Error: ${errorMessage}] Điểm sáng rực rỡ nhất ở bạn chính là ngọn lửa nhiệt huyết lan tỏa tự nhiên, khả năng kết nối con người bằng sự chân thành và thấu cảm sâu sắc.`,
          AI_PAGE3_P2: "Sự hòa quyện giữa tư duy sáng tạo linh hoạt và trái tim nhân ái mãnh liệt tạo nên một con người vừa giàu ý tưởng đột phá, vừa biết cách hiện thực hóa chúng."
        };
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
    
    // Remove literal newlines and control characters that break JSON strings
    textResult = textResult.replace(/[\r\n\t]+/g, ' ');

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
