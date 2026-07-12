import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const maxDuration = 120;

// ── Fallback data khi không có API key ──────────────────────────────────────
const FALLBACK_DATA = {
  insights: {
    insight_1: "Bạn có khả năng truyền cảm hứng rất mạnh, nhưng lại dễ mất động lực khi môi trường quá cứng nhắc hoặc nhiều quy trình bắt buộc.",
    insight_2: "Bạn thường giúp người khác định hướng cuộc đời nhưng lại khó quyết định cho chính mình — đặc biệt khi có quá nhiều lựa chọn hấp dẫn cùng lúc.",
    insight_3: "Tiền không phải động lực lớn nhất của bạn, nhưng khi làm công việc có ý nghĩa, bạn lại kiếm tiền tốt hơn nhiều người xung quanh.",
  },
  risk: {
    risk_percent: 73,
    risk_description: "Người có kết quả giống bạn thường chọn sai ngành vì bị ảnh hưởng bởi áp lực gia đình hoặc trào lưu xã hội, thay vì lắng nghe bản thân.",
  },
  careers: {
    top_careers: [
      { rank: 1, title: "???", match: 96, reason: "Phù hợp cao nhất với tổ hợp tính cách của bạn", locked: true },
      { rank: 2, title: "???", match: 94, reason: "Phù hợp cao, khai thác tối đa điểm mạnh tự nhiên", locked: true },
      { rank: 3, title: "Nhà sáng tạo nội dung", match: 88, reason: "Sáng tạo kết hợp khả năng kết nối cảm xúc với khán giả", locked: false },
      { rank: 4, title: "Chuyên viên Truyền thông", match: 85, reason: "Kết nối con người, xử lý tình huống linh hoạt và năng động", locked: false },
      { rank: 5, title: "Điều phối viên Dự án", match: 82, reason: "Tổ chức, dẫn dắt đội nhóm đạt mục tiêu chung có tác động", locked: false },
    ],
    avoid_careers: [
      { title: "Kế toán / Kiểm toán", reason: "Công việc lặp đi lặp lại, ít sáng tạo sẽ khiến bạn chán nản nhanh" },
      { title: "Kỹ thuật viên sản xuất", reason: "Môi trường cứng nhắc, thiếu tương tác xã hội không phù hợp với bạn" },
      { title: "Nhân viên hành chính văn phòng", reason: "Ít cơ hội phát triển và thể hiện bản thân theo cách riêng" },
    ],
  },
};

function initFirebase() {
  if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({ credential: cert(serviceAccount) });
    } catch (e) {
      console.warn('Firebase init error:', e);
    }
  }
}

async function callClaudeJson(anthropic: Anthropic, promptText: string): Promise<any> {
  // ── Model list — KHÔNG đổi tên model ──────────────────────────────────────
  const modelsToTry = [
    "claude-sonnet-5",
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001",
  ];

  let lastError = '';
  for (const modelName of modelsToTry) {
    try {
      const message = await anthropic.messages.create({
        model: modelName,
        max_tokens: 4096,
        system: "You are a JSON generator. Return ONLY a valid JSON object with no markdown, no code blocks, no explanation. All string values must use proper JSON escaping.",
        messages: [{ role: "user", content: promptText }],
      });

      let textResult = '';
      if (Array.isArray(message.content)) {
        const block = message.content.find((b: any) => b.type === 'text') as any;
        textResult = block?.text ?? '';
      } else {
        textResult = String(message.content);
      }

      // Strip markdown fences
      textResult = textResult
        .replace(/^[\s\S]*?```(?:json)?\s*/i, '')
        .replace(/\s*```[\s\S]*$/i, '')
        .trim();

      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) textResult = jsonMatch[0];
      textResult = textResult.replace(/[\r\n\t]+/g, ' ');

      return JSON.parse(textResult);
    } catch (err: any) {
      lastError = `${modelName}: ${err.message}`;
    }
  }

  // Fallback to Gemini if all Claude models fail
  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const geminiModels = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"];
      for (const gm of geminiModels) {
        try {
          const model = genAI.getGenerativeModel({ model: gm });
          const result = await model.generateContent(
            "Return ONLY a valid JSON object with no markdown.\n\n" + promptText
          );
          const response = await result.response;
          let text = response.text()
            .replace(/^[\s\S]*?```(?:json)?\s*/i, '')
            .replace(/\s*```[\s\S]*$/i, '')
            .trim();
          const m = text.match(/\{[\s\S]*\}/);
          if (m) text = m[0];
          text = text.replace(/[\r\n\t]+/g, ' ');
          return JSON.parse(text);
        } catch { /* try next */ }
      }
    } catch { /* gemini not available */ }
  }

  throw new Error(`All models failed. Last: ${lastError}`);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mbti, holland, lifePath, assessmentId } = body;

    if (!mbti || !holland) {
      return NextResponse.json({ error: 'Missing mbti or holland' }, { status: 400 });
    }

    const hollandStr = Array.isArray(holland) ? holland.join('/') : String(holland);

    // ── Check Firestore cache ────────────────────────────────────────────────
    initFirebase();
    if (assessmentId && getApps().length) {
      try {
        const db = getFirestore();
        const snap = await db.collection('assessments').doc(assessmentId).get();
        if (snap.exists) {
          const cached = snap.data()?.dashboardAiCache;
          if (cached) {
            const parsed = JSON.parse(cached);
            // Kiểm tra cache có đầy đủ avoid_careers không
            // Nếu cache cũ thiếu avoid_careers → bỏ qua, gọi AI lại để sinh đầy đủ
            const hasAvoidCareers =
              Array.isArray(parsed?.careers?.avoid_careers) &&
              parsed.careers.avoid_careers.length > 0;
            if (hasAvoidCareers) {
              console.warn(`✅ dashboard-ai cache hit for assessment ${assessmentId}`);
              return NextResponse.json({ ...parsed, cached: true });
            } else {
              console.warn(`⚠️ dashboard-ai cache for ${assessmentId} missing avoid_careers — regenerating...`);
            }
          }
        }
      } catch (e) {
        console.warn('Firestore cache read error:', e);
      }
    }

    // ── Return fallback if no API key ────────────────────────────────────────
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('No ANTHROPIC_API_KEY — returning fallback data');
      return NextResponse.json(FALLBACK_DATA);
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // ── Prompt A: 3 Insights (Section 2) ────────────────────────────────────
    const promptA = `Bạn là chuyên gia tâm lý nghề nghiệp. Dựa trên tổ hợp tính cách ${mbti} kết hợp với nhóm nghề nghiệp Holland ${hollandStr}, hãy viết chính xác 3 câu nhận xét cá nhân hóa về người này.

YÊU CẦU BẮT BUỘC:
- Mỗi câu phải cụ thể cho TỔ HỢP ${mbti} x ${hollandStr}, KHÔNG phải mô tả chung áp dụng cho bất kỳ ai
- Mỗi câu phải chứa một nghịch lý hoặc mâu thuẫn nội tại
- Mỗi câu dài 1-2 dòng, ngôn ngữ đời thường, học sinh lớp 10-11 đọc hiểu được
- KHÔNG dùng thuật ngữ MBTI, Holland, ENFP, S/E trong câu trả lời
- KHÔNG mở đầu bằng Bạn là người
- Giọng văn: như một người thầy thấu hiểu đang nói chuyện riêng với học sinh

Trả lời ĐÚNG định dạng JSON:
{"insight_1": "...", "insight_2": "...", "insight_3": "..."}`;

    // ── Prompt B: Risk Warning (Section 4) ──────────────────────────────────
    const promptB = `Bạn là chuyên gia tâm lý nghề nghiệp. Dựa trên tổ hợp tính cách ${mbti} kết hợp với nhóm nghề nghiệp Holland ${hollandStr}, hãy phân tích rủi ro lớn nhất khi người này chọn sai ngành.

YÊU CẦU BẮT BUỘC:
- Đưa ra 1 con số % (từ 60-80%) thể hiện tỷ lệ người có tổ hợp này gặp vấn đề khi chọn sai ngành
- Mô tả nguyên nhân chính khiến nhóm này hay chọn sai (1-2 câu)
- KHÔNG dùng thuật ngữ MBTI, Holland trong câu trả lời
- Ngôn ngữ đời thường, học sinh lớp 10-11 đọc hiểu được

Trả lời ĐÚNG định dạng JSON:
{"risk_percent": 73, "risk_description": "..."}`;

    // ── Prompt C: Top 5 Careers (Section 3) ─────────────────────────────────
    const promptC = `Bạn là chuyên gia tư vấn nghề nghiệp tại Việt Nam. Dựa trên tổ hợp tính cách ${mbti} kết hợp với nhóm nghề nghiệp Holland ${hollandStr} và số chủ đạo ${lifePath || 'không xác định'}, hãy gợi ý nghề nghiệp phù hợp.

YÊU CẦU BẮT BUỘC:
- Đưa ra chính xác 5 nghề phù hợp nhất, xếp theo % phù hợp giảm dần
- Đưa ra chính xác 3 nghề nên tránh
- Mỗi nghề có: tên tiếng Việt, % phù hợp (70-96%), lý do ngắn gọn (1 câu, dưới 20 từ)
- Nghề thực tế trên thị trường lao động Việt Nam
- KHÔNG dùng thuật ngữ MBTI, Holland trong lý do
- % giảm dần từ #1 đến #5, nghề #1 cao hơn #3 ít nhất 5%

Trả lời ĐÚNG định dạng JSON:
{
  "top_careers": [
    {"rank": 1, "title": "...", "match": 96, "reason": "..."},
    {"rank": 2, "title": "...", "match": 94, "reason": "..."},
    {"rank": 3, "title": "...", "match": 88, "reason": "..."},
    {"rank": 4, "title": "...", "match": 85, "reason": "..."},
    {"rank": 5, "title": "...", "match": 82, "reason": "..."}
  ],
  "avoid_careers": [
    {"title": "...", "reason": "..."},
    {"title": "...", "reason": "..."},
    {"title": "...", "reason": "..."}
  ]
}`;

    // ── Call all 3 prompts in parallel ───────────────────────────────────────
    const [insightsRaw, riskRaw, careersRaw] = await Promise.allSettled([
      callClaudeJson(anthropic, promptA),
      callClaudeJson(anthropic, promptB),
      callClaudeJson(anthropic, promptC),
    ]);

    const insights = insightsRaw.status === 'fulfilled' ? insightsRaw.value : FALLBACK_DATA.insights;
    const risk = riskRaw.status === 'fulfilled' ? riskRaw.value : FALLBACK_DATA.risk;
    const careersData = careersRaw.status === 'fulfilled' ? careersRaw.value : FALLBACK_DATA.careers;

    // Add locked flags to top_careers
    const careers = {
      ...careersData,
      top_careers: (careersData.top_careers || []).map((c: any) => ({
        ...c,
        locked: c.rank <= 2,
      })),
    };

    const result = { insights, risk, careers };

    // ── Save to Firestore cache ──────────────────────────────────────────────
    if (assessmentId && getApps().length) {
      try {
        const db = getFirestore();
        await db.collection('assessments').doc(assessmentId).update({
          dashboardAiCache: JSON.stringify(result),
        });
        console.warn(`💾 dashboard-ai saved to Firestore for assessment ${assessmentId}`);
      } catch (e) {
        console.warn('Firestore cache write error:', e);
      }
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('dashboard-ai error:', error);
    return NextResponse.json(FALLBACK_DATA);
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
