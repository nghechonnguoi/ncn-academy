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

// ── Tính avoid_careers deterministic từ RIASEC pool ─────────────────────────
// Logic: tìm nghề có primary RIASEC code KHÔNG khớp với top3 của người dùng
// → nghề thuộc nhóm/môi trường ngược với xu hướng năng lực & tính cách
function computeAvoidCareers(hollandStr: string): { title: string; reason: string }[] {
  // Trích top 3 chữ RIASEC từ chuỗi (vd: "SAE", "S/A/E", "ESC")
  const top3Letters = hollandStr.replace(/[^RIASCE]/g, '').split('').slice(0, 3);
  if (top3Letters.length < 2) return []; // thiếu dữ liệu

  const ALL_C: { name: string; riasec: string; industry: string }[] = [
    // Nhóm R (kỹ thuật – máy móc)
    { name: 'Lập trình viên hệ thống / Nhúng (C/C++)', riasec: 'RIC', industry: 'Kỹ thuật – Phần mềm nhúng' },
    { name: 'Kỹ sư cơ khí chế tạo máy', riasec: 'RIC', industry: 'Cơ khí – Kỹ thuật' },
    { name: 'Kỹ sư điện – điện tử công nghiệp', riasec: 'RIC', industry: 'Điện – Điện tử' },
    { name: 'Kỹ sư xây dựng dân dụng', riasec: 'RIE', industry: 'Xây dựng – Kiến trúc' },
    { name: 'Kỹ thuật viên vận hành máy CNC', riasec: 'RCI', industry: 'Sản xuất – Gia công' },
    // Nhóm I (nghiên cứu – phân tích)
    { name: 'Nhà khoa học dữ liệu (Data Scientist)', riasec: 'ICA', industry: 'Dữ liệu – Phân tích' },
    { name: 'Nghiên cứu viên / Giảng viên đại học', riasec: 'IAS', industry: 'Nghiên cứu – Hàn lâm' },
    { name: 'Kỹ sư DevOps / SRE hệ thống', riasec: 'IRC', industry: 'Hạ tầng Công nghệ' },
    { name: 'Chuyên viên thống kê / Kinh tế lượng', riasec: 'ICR', industry: 'Thống kê – Kinh tế' },
    // Nhóm A (nghệ thuật – sáng tạo độc lập)
    { name: 'Họa sĩ / Illustrator tự do', riasec: 'AEI', industry: 'Nghệ thuật – Thiết kế' },
    { name: 'Nhạc sĩ / Nghệ sĩ biểu diễn sân khấu', riasec: 'ASE', industry: 'Nghệ thuật – Âm nhạc' },
    { name: 'Nhà văn / Biên kịch sáng tác', riasec: 'AIE', industry: 'Sáng tác – Xuất bản' },
    // Nhóm S (chăm sóc – hỗ trợ con người)
    { name: 'Giáo viên mầm non / tiểu học', riasec: 'SAC', industry: 'Giáo dục' },
    { name: 'Công tác xã hội viên / Tư vấn cộng đồng', riasec: 'SAE', industry: 'Xã hội – Cộng đồng' },
    { name: 'Điều dưỡng viên / Hộ sinh', riasec: 'SRC', industry: 'Y tế – Sức khỏe' },
    // Nhóm E (lãnh đạo – kinh doanh – thuyết phục)
    { name: 'Chuyên viên kinh doanh bất động sản', riasec: 'ESC', industry: 'Bất động sản' },
    { name: 'Đại lý bảo hiểm / Tư vấn tài chính cá nhân', riasec: 'ESC', industry: 'Tài chính – Bảo hiểm' },
    { name: 'Luật sư doanh nghiệp / Tư vấn pháp lý', riasec: 'ECA', industry: 'Pháp lý – Luật' },
    // Nhóm C (quy trình – hành chính – số liệu)
    { name: 'Kế toán viên / Kế toán tổng hợp', riasec: 'CSI', industry: 'Kế toán – Tài chính' },
    { name: 'Kiểm toán viên', riasec: 'CIE', industry: 'Kiểm toán – Tài chính' },
    { name: 'Nhân viên hành chính – văn thư lưu trữ', riasec: 'CSE', industry: 'Hành chính – Văn phòng' },
    { name: 'Chuyên viên tuân thủ pháp lý (Compliance)', riasec: 'CEI', industry: 'Tuân thủ – Pháp lý' },
  ];

  const RIASEC_ENV: Record<string, string> = {
    R: 'môi trường kỹ thuật – làm việc trực tiếp với máy móc và công cụ vật lý',
    I: 'nghiên cứu độc lập – phân tích dữ liệu và giải quyết vấn đề trừu tượng',
    A: 'biểu đạt nghệ thuật tự do và thẩm mỹ cá nhân',
    S: 'giao tiếp – chăm sóc và hỗ trợ con người trực tiếp',
    E: 'lãnh đạo – kinh doanh và thuyết phục người khác',
    C: 'quy trình chặt chẽ – xử lý số liệu và chi tiết hành chính',
  };

  // Xác định bottom letters = các nhóm KHÔNG có trong top3
  const allLetters = ['R', 'I', 'A', 'S', 'E', 'C'];
  const bottom = allLetters.filter(l => !top3Letters.includes(l));

  // Lọc nghề có primary code thuộc bottom (không phù hợp vòng 1 RIASEC)
  const candidates = ALL_C.filter(c => bottom.includes(c.riasec[0]));

  // Ưu tiên nghề có TẤT CẢ RIASEC codes đều không khớp top3 (hoàn toàn ngược)
  const fullyOpposite = candidates.filter(c =>
    c.riasec.split('').every(l => !top3Letters.includes(l))
  );
  const partial = candidates.filter(c => !fullyOpposite.includes(c));

  // Chọn 3 nghề từ 3 ngành KHÁC NHAU và 3 primary RIASEC code KHÁC NHAU
  // → đảm bảo mỗi reason có nội dung khác nhau (không bị lặp)
  const picked: typeof candidates = [];
  const usedIndustries = new Set<string>();
  const usedPrimaryCode = new Set<string>();
  for (const career of [...fullyOpposite, ...partial]) {
    if (picked.length >= 3) break;
    const primaryCode = career.riasec[0];
    if (!usedIndustries.has(career.industry) && !usedPrimaryCode.has(primaryCode)) {
      picked.push(career);
      usedIndustries.add(career.industry);
      usedPrimaryCode.add(primaryCode);
    }
  }
  // Fallback: nếu strict constraint không đủ 3 → thả lỏng constraint industry
  if (picked.length < 3) {
    for (const career of [...fullyOpposite, ...partial]) {
      if (picked.length >= 3) break;
      if (!picked.includes(career) && !usedPrimaryCode.has(career.riasec[0])) {
        picked.push(career);
        usedPrimaryCode.add(career.riasec[0]);
      }
    }
  }
  // Final fallback: nếu vẫn chưa đủ → lấy bất kỳ miễn không trùng
  if (picked.length < 3) {
    for (const career of [...fullyOpposite, ...partial]) {
      if (picked.length >= 3) break;
      if (!picked.includes(career)) picked.push(career);
    }
  }

  // Tạo lý do từ RIASEC mismatch
  const personEnvs = top3Letters.slice(0, 2)
    .map(l => RIASEC_ENV[l] ?? l)
    .join(' và ');

  return picked.map(career => ({
    title: career.name,
    reason: `Nghề này đòi hỏi ${RIASEC_ENV[career.riasec[0]] ?? 'năng lực khác biệt'}, trong khi bạn phát triển tốt nhất ở ${personEnvs} — sự mâu thuẫn môi trường này dễ dẫn đến kiệt sức và mất động lực lâu dài.`,
  }));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mbti, holland, lifePath, assessmentId } = body;

    if (!mbti || !holland) {
      return NextResponse.json({ error: 'Missing mbti or holland' }, { status: 400 });
    }

    const hollandStr = Array.isArray(holland) ? holland.join('/') : String(holland);

    // ── Tính avoid_careers ngay từ đầu (deterministic, không cần AI) ─────────
    const avoidCareers = computeAvoidCareers(hollandStr);

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
            const hasTopCareers =
              Array.isArray(parsed?.careers?.top_careers) &&
              parsed.careers.top_careers.length > 0;

            if (hasTopCareers) {
              // Cache đầy đủ — patch avoid_careers với phiên bản deterministic mới
              const patchedResult = {
                ...parsed,
                careers: {
                  ...parsed.careers,
                  avoid_careers: avoidCareers.length >= 3 ? avoidCareers : (parsed.careers.avoid_careers || FALLBACK_DATA.careers.avoid_careers),
                },
              };
              console.warn(`✅ dashboard-ai cache hit for assessment ${assessmentId}`);
              return NextResponse.json({ ...patchedResult, cached: true });
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
      const fallbackWithDeterministic = {
        ...FALLBACK_DATA,
        careers: {
          ...FALLBACK_DATA.careers,
          avoid_careers: avoidCareers.length >= 3 ? avoidCareers : FALLBACK_DATA.careers.avoid_careers,
        },
      };
      return NextResponse.json(fallbackWithDeterministic);
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

    // ── Prompt C: Top 5 Careers only — avoid_careers đã có từ deterministic ──
    const promptC = `Bạn là chuyên gia tư vấn nghề nghiệp tại Việt Nam. Dựa trên tổ hợp tính cách ${mbti} kết hợp với nhóm nghề nghiệp Holland ${hollandStr} và số chủ đạo ${lifePath || 'không xác định'}, hãy gợi ý NGHỀ NGHIỆP phù hợp.

ĐỊNH NGHĨA: "Nghề nghiệp" = lĩnh vực hoạt động chuyên môn mà người ta theo đuổi lâu dài (vd: Nhà thiết kế đồ họa, Kỹ sư phần mềm, Giáo viên, Nhà tâm lý học, Kiến trúc sư, Nhà báo, Bác sĩ, Chuyên viên marketing, Lập trình viên, Nhiếp ảnh gia...).

TUYỆT ĐỐI KHÔNG đặt tên theo chức danh quản lý / cấp bậc như: Giám đốc, Trưởng phòng, Phó giám đốc, CEO, Quản lý, Manager, Head of..., VP...

VÍ DỤ ĐÚNG: "Nhà thiết kế UX/UI", "Chuyên viên tư vấn tâm lý", "Kỹ sư phần mềm", "Nhà báo / Biên tập viên", "Chuyên viên marketing số"
VÍ DỤ SAI: "Giám đốc marketing", "Trưởng nhóm thiết kế", "Giám đốc phát triển kinh doanh"

YÊU CẦU BẮT BUỘC:
- Đưa ra chính xác 5 NGHỀ phù hợp nhất (không phải vị trí/chức danh), xếp theo % phù hợp giảm dần
- Mỗi nghề có: tên nghề tiếng Việt (ngắn gọn, rõ ràng), % phù hợp (70-96%), lý do ngắn gọn (1 câu, dưới 20 từ)
- Nghề thực tế tại Việt Nam, có thể học và theo đuổi được
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
    const careersData = careersRaw.status === 'fulfilled' ? careersRaw.value : {};

    // Add locked flags + merge deterministic avoid_careers
    const careers = {
      top_careers: ((careersData as any).top_careers || FALLBACK_DATA.careers.top_careers).map((c: any) => ({
        ...c,
        locked: c.rank <= 2,
      })),
      avoid_careers: avoidCareers.length >= 3 ? avoidCareers : FALLBACK_DATA.careers.avoid_careers,
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
