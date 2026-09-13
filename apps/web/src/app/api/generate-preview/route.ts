import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export const maxDuration = 60;

// Cache TTL: 30 ngày
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function initFirebase() {
  if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({ credential: cert(serviceAccount) });
    } catch (e) {
      console.warn('[generate-preview] Firebase init error:', e);
    }
  }
}

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

    // ── Cache key theo MBTI + Holland top3 ──────────────────────────────────
    const mbti    = String(data.MBTI    || 'UNKNOWN').toUpperCase().trim();
    const holland = String(data.HOLLAND || 'UNKNOWN').toUpperCase().replace(/[^RIASCE]/g, '').substring(0, 3);
    const cacheKey = `${mbti}_${holland}`;

    // ── Check Firestore cache (30 ngày TTL) ──────────────────────────────────
    initFirebase();
    if (getApps().length) {
      try {
        const db = getFirestore();
        const snap = await db.collection('preview_ai_cache').doc(cacheKey).get();
        if (snap.exists) {
          const cached = snap.data()!;
          const age = Date.now() - (cached.generatedAt as Timestamp).toMillis();
          if (age < CACHE_TTL_MS) {
            console.warn(`✅ [generate-preview] cache hit: ${cacheKey} (${Math.round(age / 86400000)}d old)`);
            return NextResponse.json({
              AI_PAGE3_P1: cached.AI_PAGE3_P1,
              AI_PAGE3_P2: cached.AI_PAGE3_P2,
              AI_PAGE3_P3: cached.AI_PAGE3_P3,
              cached: true,
            });
          }
          console.warn(`🔄 [generate-preview] cache expired: ${cacheKey}`);
        } else {
          console.warn(`⬇️  [generate-preview] cache miss: ${cacheKey}`);
        }
      } catch (e) {
        console.warn('[generate-preview] Firestore read error:', e);
      }
    }

    // ── Build prompt ─────────────────────────────────────────────────────────
    const userInfo = `- Tên: ${data.HOTEN}
- Nhóm tính cách MBTI: ${data.MBTI}
- Mã Holland: ${data.HOLLAND}
- Điểm Holland: R(${data.R_PCT}%), I(${data.I_PCT}%), A(${data.A_PCT}%), S(${data.S_PCT}%), E(${data.E_PCT}%), C(${data.C_PCT}%)
- Tiềm năng bẩm sinh (Life Path): ${data.LIFEPATH || "Không có"}
- Khao khát nội tại (Soul): ${data.SOUL || "Không có"}
- Số Sứ mệnh (Mission): ${data.MISSION || "Không có"}
- Chỉ số Tài năng (Talent): ${data.TALENT || "Không có"}
- Chỉ số Đam mê (Passion): ${data.PASSION || "Không có"}`;

    const instruction = "Bạn là chuyên gia tư vấn hướng nghiệp xuất sắc. Sinh ra BẮT BUỘC một JSON hợp lệ. YÊU CẦU QUAN TRỌNG: 1. Viết thật sâu sắc, đắc nhân tâm, truyền cảm hứng mạnh mẽ. 2. LUÔN LỒNG GHÉP VÀ TỔNG HÒA ý nghĩa của 5 khía cạnh cốt lõi (Tiềm năng bẩm sinh, Khao khát nội tại, Sứ mệnh, Tài năng, Đam mê) cùng với MBTI và Holland vào bài viết. 3. KHÔNG BAO GIỜ gọi đích danh tên các chỉ số (như MBTI, Holland, Số chủ đạo...). Hãy biến chúng thành những phẩm chất cá nhân chân thật. 4. DANH XƯNG GIAO TIẾP: Xuyên suốt báo cáo, chỉ được phép xưng hô với khách hàng bằng Tên thật của họ, hoặc Họ Tên, hoặc dùng đại từ 'bạn'.";

    const promptText = `${instruction}
Thông tin ứng viên:
${userInfo}

{
  "AI_PAGE3_P1": "Phân tích tổng quan về điểm sáng nhất trong tính cách của ứng viên (dài ~100 chữ).",
  "AI_PAGE3_P2": "Phân tích về sự kết hợp giữa các đặc điểm nổi trội (dài ~80 chữ).",
  "AI_PAGE3_P3": "Dự đoán môi trường làm việc (tương tác, văn hóa, không gian) giúp ứng viên tỏa sáng và phát huy tối đa năng lực nhất (dài ~50 chữ)."
}`;

    // ── Gọi AI (haiku primary) ────────────────────────────────────────────────
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    let message: any;
    let fallbackResult = null;
    const anthropicModelsToTry = [
      "claude-haiku-4-5-20251001",    // model chính — rẻ, đủ nhanh
      "claude-sonnet-4-6",            // fallback nếu haiku lỗi
    ];

    const errors: string[] = [];
    for (const modelName of anthropicModelsToTry) {
      try {
        message = await anthropic.messages.create({
          model: modelName,
          max_tokens: 1024,
          system: "Bạn chỉ được phép trả về duy nhất một object JSON hợp lệ. TUYỆT ĐỐI CHỈ SỬ DỤNG CHỮ CÁI, CHỮ SỐ, DẤU CHẤM, DẤU PHẨY ĐỂ VIẾT CÂU. TUYỆT ĐỐI KHÔNG SỬ DỤNG DẤU NGOẶC KÉP (\"), DẤU NHÁY ĐƠN ('), DẤU NGOẶC ĐƠN, KÝ TỰ XUỐNG DÒNG (ENTER), DẤU GẠCH NGANG HAY BẤT KỲ KÝ TỰ ĐẶC BIỆT NÀO KHÁC BÊN TRONG NỘI DUNG VĂN BẢN (VALUES) CỦA JSON. VIỆC DÙNG KÝ TỰ ĐẶC BIỆT SẼ LÀM HỎNG TRÌNH BIÊN DỊCH JSON VÀ GÂY LỖI HỆ THỐNG TRẦM TRỌNG.",
          messages: [{ role: "user", content: promptText }]
        });
        break;
      } catch (err: any) {
        errors.push(`${modelName}: ${err.message}`);
      }
    }

    if (!message) {
      if (process.env.GEMINI_API_KEY) {
        console.warn("Anthropic failed, falling back to Gemini...");
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const geminiModelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro", "gemini-2.0-flash-exp"];
        let result;
        const geminiErrors: string[] = [];
        for (const gModel of geminiModelsToTry) {
          try {
            const model = genAI.getGenerativeModel({ model: gModel });
            result = await model.generateContent("Bạn chỉ được phép trả về duy nhất một object JSON hợp lệ. TUYỆT ĐỐI CHỈ SỬ DỤNG CHỮ CÁI, CHỮ SỐ, DẤU CHẤM, DẤU PHẨY ĐỂ VIẾT CÂU. TUYỆT ĐỐI KHÔNG SỬ DỤNG DẤU NGOẶC KÉP (\"), DẤU NHÁY ĐƠN ('), DẤU NGOẶC ĐƠN, KÝ TỰ XUỐNG DÒNG (ENTER), DẤU GẠCH NGANG HAY BẤT KỲ KÝ TỰ ĐẶC BIỆT NÀO KHÁC BÊN TRONG NỘI DUNG VĂN BẢN (VALUES) CỦA JSON. VIỆC DÙNG KÝ TỰ ĐẶC BIỆT SẼ LÀM HỎNG TRÌNH BIÊN DỊCH JSON VÀ GÂY LỖI HỆ THỐNG TRẦM TRỌNG.\n\n" + promptText);
            break;
          } catch (err: any) { geminiErrors.push(`${gModel}: ${err.message}`); }
        }
        if (!result) {
          console.error("Preview API all models failed", errors.join(" | ") + " | " + geminiErrors.join(" | "));
          fallbackResult = { AI_PAGE3_P1: "Điểm sáng rực rỡ nhất ở bạn chính là ngọn lửa nhiệt huyết lan tỏa tự nhiên.", AI_PAGE3_P2: "Sự hòa quyện giữa tư duy sáng tạo linh hoạt và trái tim nhân ái mãnh liệt tạo nên một con người vừa giàu ý tưởng đột phá." };
        } else {
          message = { content: (await result.response).text() };
        }
      } else {
        console.error("Preview API all models failed", errors.join(" | "));
        fallbackResult = { AI_PAGE3_P1: "Điểm sáng rực rỡ nhất ở bạn chính là ngọn lửa nhiệt huyết lan tỏa tự nhiên.", AI_PAGE3_P2: "Sự hòa quyện giữa tư duy sáng tạo linh hoạt và trái tim nhân ái mãnh liệt tạo nên một con người vừa giàu ý tưởng đột phá." };
      }
    }

    if (fallbackResult) return NextResponse.json(fallbackResult);

    // ── Parse AI output ───────────────────────────────────────────────────────
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
    if (jsonMatch) textResult = jsonMatch[0];
    textResult = textResult.replace(/[\r\n\t]+/g, ' ');

    const parsed = JSON.parse(textResult);

    // ── Lưu vào Firestore cache ───────────────────────────────────────────────
    if (getApps().length && parsed.AI_PAGE3_P1) {
      try {
        const db = getFirestore();
        await db.collection('preview_ai_cache').doc(cacheKey).set({
          AI_PAGE3_P1: parsed.AI_PAGE3_P1,
          AI_PAGE3_P2: parsed.AI_PAGE3_P2 || '',
          AI_PAGE3_P3: parsed.AI_PAGE3_P3 || '',
          mbti,
          holland,
          model: 'claude-haiku-4-5-20251001',
          generatedAt: Timestamp.now(),
        });
        console.warn(`💾 [generate-preview] cache saved: ${cacheKey}`);
      } catch (e) {
        console.warn('[generate-preview] Firestore write error:', e);
      }
    }

    return NextResponse.json(parsed);

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
