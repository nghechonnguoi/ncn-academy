import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
// ❌ REMOVED: import { getStorage } from 'firebase-admin/storage';
// ✅ Không cần Firebase Storage nữa — lưu PDF base64 trực tiếp vào Firestore

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_please_change');

// Allow this API route to run for up to 300 seconds (5 minutes)
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // ── Lọc bỏ nghề "Nhân viên thực thi tổng hợp" khỏi danh sách Top 5 ──
    const BLOCKED_CAREER = 'Nhân viên thực thi tổng hợp';
    const topKeys = ['TOP1', 'TOP2', 'TOP3', 'TOP4', 'TOP5'] as const;
    const careerFields = ['TITLE','NICHE','REF','FIELD','ICI','ICI_DETAIL','SUBJECTS','KNOWLEDGE','ADVICE','KIENTHUC','KYNANG','LOTRINH','VIECLEM'] as const;

    // Collect non-blocked slots
    const validSlots: number[] = [];
    for (const key of topKeys) {
      if ((data[`${key}_TITLE`] || '') !== BLOCKED_CAREER) {
        validSlots.push(topKeys.indexOf(key) + 1);
      }
    }
    // Re-map: compress valid slots to positions 1,2,3...
    for (let newPos = 0; newPos < topKeys.length; newPos++) {
      const srcPos = validSlots[newPos]; // may be undefined if ran out
      const destKey = topKeys[newPos];
      for (const field of careerFields) {
        if (srcPos !== undefined) {
          const srcKey = topKeys[srcPos - 1];
          data[`${destKey}_${field}`] = data[`${srcKey}_${field}`] ?? '';
        } else {
          // Clear trailing slots
          data[`${destKey}_${field}`] = ['ICI'].includes(field) ? 0 : '';
        }
      }
    }
    // ── End filter ──


    // Initialize Firebase Admin if not already initialized
    if (!getApps().length) {
      try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
          initializeApp({
            credential: cert(serviceAccount)
          });
        }
      } catch (error) {
        console.error("Firebase admin init error:", error);
      }
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY is not set. Using generic texts.");
    }
    let cachedAiTexts: any = null;
    if (data.orderCode && getApps().length) {
      try {
        const dbCheck = getFirestore();
        const orderSnap = await dbCheck.collection('orders').doc(String(data.orderCode)).get();
        if (orderSnap.exists) {
          const orderData = orderSnap.data();
          if (orderData?.aiTextsCache) {
            const parsed = JSON.parse(orderData.aiTextsCache);
            // Chỉ dùng cache nếu có CAREER fields thực sự (tránh cache cũ không đủ)
            if (parsed?.CAREER_1_KIENTHUC && parsed?.CAREER_1_SCIENCE) {
              cachedAiTexts = parsed;
              console.warn(`✅ Dùng lại nội dung AI đã lưu cho đơn ${data.orderCode}`);
            } else {
              console.warn(`⚠️ Cache đơn ${data.orderCode} thiếu CAREER fields — regenerate`);
            }
          }
        }
      } catch (e) {
        console.warn("Không đọc được cache nội dung AI:", e);
      }
    }

    // ── Tính avoid_careers deterministic từ RIASEC ──────────────────────────────
    // Luôn ghi đè AVOID fields bằng thuật toán RIASEC — không dùng cache cũ từ Firestore
    (() => {
      const hollandStr = String(data.HOLLAND || '');
      const top3 = hollandStr.replace(/[^RIASCE]/g, '').substring(0, 3);
      if (top3.length < 2) return;
      const ALL_C = [
        { name: 'Lập trình viên hệ thống / Nhúng (C/C++)', riasec: 'RIC', industry: 'Kỹ thuật – Phần mềm nhúng' },
        { name: 'Kỹ sư cơ khí chế tạo máy', riasec: 'RIC', industry: 'Cơ khí – Kỹ thuật' },
        { name: 'Kỹ sư điện – điện tử công nghiệp', riasec: 'RIC', industry: 'Điện – Điện tử' },
        { name: 'Kỹ sư xây dựng dân dụng', riasec: 'RIE', industry: 'Xây dựng – Kiến trúc' },
        { name: 'Kỹ thuật viên CNC / sản xuất cơ khí', riasec: 'RCI', industry: 'Sản xuất – Gia công' },
        { name: 'Nhà khoa học dữ liệu (Data Scientist)', riasec: 'ICA', industry: 'Dữ liệu – Phân tích' },
        { name: 'Nghiên cứu viên / Giảng viên đại học', riasec: 'IAS', industry: 'Nghiên cứu – Hàn lâm' },
        { name: 'Kỹ sư DevOps / SRE hệ thống', riasec: 'IRC', industry: 'Hạ tầng Công nghệ' },
        { name: 'Chuyên viên thống kê / Kinh tế lượng', riasec: 'ICR', industry: 'Thống kê – Kinh tế' },
        { name: 'Họa sĩ / Illustrator tự do', riasec: 'AEI', industry: 'Nghệ thuật – Thiết kế' },
        { name: 'Nhạc sĩ / Nghệ sĩ biểu diễn sân khấu', riasec: 'ASE', industry: 'Nghệ thuật – Âm nhạc' },
        { name: 'Nhà văn / Biên kịch sáng tác', riasec: 'AIE', industry: 'Sáng tác – Xuất bản' },
        { name: 'Giáo viên mầm non / tiểu học', riasec: 'SAC', industry: 'Giáo dục' },
        { name: 'Công tác xã hội viên / Tư vấn cộng đồng', riasec: 'SAE', industry: 'Xã hội – Cộng đồng' },
        { name: 'Điều dưỡng viên / Hộ sinh', riasec: 'SRC', industry: 'Y tế – Sức khỏe' },
        { name: 'Chuyên viên kinh doanh bất động sản', riasec: 'ESC', industry: 'Bất động sản' },
        { name: 'Đại lý bảo hiểm / Tư vấn tài chính cá nhân', riasec: 'ESC', industry: 'Tài chính – Bảo hiểm' },
        { name: 'Luật sư doanh nghiệp / Tư vấn pháp lý', riasec: 'ECA', industry: 'Pháp lý – Luật' },
        { name: 'Kế toán viên / Kế toán tổng hợp', riasec: 'CSI', industry: 'Kế toán – Tài chính' },
        { name: 'Kiểm toán viên', riasec: 'CIE', industry: 'Kiểm toán – Tài chính' },
        { name: 'Nhân viên hành chính – văn thư lưu trữ', riasec: 'CSE', industry: 'Hành chính – Văn phòng' },
        { name: 'Chuyên viên tuân thủ pháp lý (Compliance)', riasec: 'CEI', industry: 'Tuân thủ – Pháp lý' },
      ];
      const RIASEC_ENV: Record<string, string> = {
        R: 'môi trường kỹ thuật – làm việc trực tiếp với máy móc và công cụ vật lý',
        I: 'nghiên cứu độc lập – phân tích dữ liệu và giải quyết vấn đề trừu tượng',
        A: 'biểu đạt nghệ thuật tự do và thẩm mỹ cá nhân',
        S: 'giao tiếp – chăm sóc và hỗ trợ con người',
        E: 'lãnh đạo – kinh doanh và thuyết phục',
        C: 'quy trình chặt chẽ – dữ liệu và chi tiết hành chính',
      };
      const top3Letters = top3.split('');
      const bottom = ['R','I','A','S','E','C'].filter((l: string) => !top3Letters.includes(l));
      const candidates = ALL_C.filter((c: any) => bottom.includes(c.riasec[0]));
      const fully = candidates.filter((c: any) => c.riasec.split('').every((l: string) => !top3Letters.includes(l)));
      const partial = candidates.filter((c: any) => !fully.includes(c));
      const picked: any[] = [];
      const usedInd = new Set<string>();
      for (const career of [...fully, ...partial]) {
        if (picked.length >= 3) break;
        if (!usedInd.has(career.industry)) { picked.push(career); usedInd.add(career.industry); }
      }
      if (picked.length < 3) return;
      const personEnvs = top3Letters.slice(0, 2).map((l: string) => RIASEC_ENV[l] ?? l).join(' và ');
      picked.forEach((career: any, i: number) => {
        const n = i + 1;
        data[`AVOID_${n}_TITLE`]  = career.name;
        data[`AVOID_${n}_REASON`] = `Nghề này yêu cầu ${RIASEC_ENV[career.riasec[0]] ?? 'năng lực khác biệt'}, trong khi bạn phát triển tốt nhất ở ${personEnvs} — sự mâu thuẫn môi trường này dễ dẫn đến kiệt sức và mất động lực lâu dài.`;
      });
      console.warn(`✅ avoid_careers deterministic: HOLLAND=${top3} → [${picked.map((c: any) => c.name).join(' | ')}]`);
    })();

    const userInfo = `- Tên: ${data.HOTEN}
- Nhóm tính cách MBTI: ${data.MBTI}
- Mã Holland: ${data.HOLLAND}
- Điểm Holland: R(${data.R_PCT}%), I(${data.I_PCT}%), A(${data.A_PCT}%), S(${data.S_PCT}%), E(${data.E_PCT}%), C(${data.C_PCT}%)
- Tiềm năng bẩm sinh (Life Path): ${data.LIFEPATH || "Không có"}
- Khao khát nội tại (Soul): ${data.SOUL || "Không có"}
- Số Sứ mệnh (Mission): ${data.MISSION || "Không có"}
- Chỉ số Tài năng (Talent): ${data.TALENT || "Không có"}
- Chỉ số Đam mê (Passion): ${data.PASSION || "Không có"}
- Top 5 Nghề nghiệp Đề xuất:
  1. ${data.TOP1_TITLE || "Chưa có"}
  2. ${data.TOP2_TITLE || "Chưa có"}
  3. ${data.TOP3_TITLE || "Chưa có"}
  4. ${data.TOP4_TITLE || "Chưa có"}
  5. ${data.TOP5_TITLE || "Chưa có"}`;

    const instruction = "Bạn là chuyên gia tư vấn hướng nghiệp xuất sắc. Dựa trên thông tin ứng viên, hãy sinh ra BẮT BUỘC một JSON hợp lệ có các trường sau. YÊU CẦU QUAN TRỌNG TỐI THƯỢNG: 1. Viết thật dài, sâu sắc, ngôn từ đắc nhân tâm, truyền cảm hứng mạnh mẽ. 2. TRONG TOÀN BỘ CÁC MỤC (TỪ TÍNH CÁCH, NGHỀ NGHIỆP, RÀO CẢN ĐẾN MÔI TRƯỜNG), PHẢI LUÔN LỒNG GHÉP VÀ TỔNG HÒA sâu sắc ý nghĩa của 5 khía cạnh cốt lõi (Tiềm năng bẩm sinh, Khao khát nội tâm, Sứ mệnh, Tài năng, Đam mê) cùng với MBTI và Holland. 3. KHÔNG BAO GIỜ được gọi đích danh tên các công cụ/chỉ số (như MBTI, Holland, Số chủ đạo, Số sứ mệnh, v.v...). Phải biến các chỉ số này thành những mô tả phẩm chất con người thật tự nhiên và thấu cảm. 4. DANH XƯNG GIAO TIẾP: Xuyên suốt báo cáo, chỉ được phép xưng hô với khách hàng bằng Tên thật của họ, hoặc Họ Tên, hoặc dùng đại từ 'bạn'.";

    const prompt1 = `${instruction}
Thông tin ứng viên:
${userInfo}

{
  "AI_PAGE3_P1": "Phân tích tổng quan về điểm sáng nhất trong tính cách của ứng viên (dài ~100 chữ).",
  "AI_PAGE3_P2": "Phân tích về sự kết hợp giữa các đặc điểm nổi trội (dài ~80 chữ).",
  "AI_PAGE3_P3": "Lời khuyên về môi trường làm việc phù hợp nhất (dài ~80 chữ).",
  "AI_PAGE4_P1": "Phân tích cách tư duy và giải quyết vấn đề của ứng viên (dài ~100 chữ).",
  "AI_PAGE4_P2": "Giá trị cốt lõi ứng viên đóng góp cho xã hội và tổ chức. BẮT BUỘC tập trung sâu sắc vào ý nghĩa của Số Sứ mệnh (Mission) để người dùng thấy rõ giá trị to lớn của họ, nhưng KHÔNG gọi tên từ khóa Số Sứ mệnh (dài ~100 chữ).",
  "AI_PAGE4_P3": "Rủi ro khi ứng viên đối mặt với áp lực và điểm nghẽn tâm lý (dài ~100 chữ).",
  "AI_PAGE4_RECOVERY": "Lời khuyên để vượt qua áp lực (dài ~60 chữ).",
  "AI_PAGE5_P1": "Lời khen ngợi về năng lực thiên bẩm, tập trung đào sâu vào ý nghĩa của chỉ số Tài năng (ngày sinh) của ứng viên nhưng TUYỆT ĐỐI KHÔNG nhắc đến tên chỉ số hay ngày sinh (dài ~150 chữ).",
  "AI_PAGE5_P2": "Di sản và giá trị dài hạn ứng viên có thể tạo ra cho xã hội, tập trung đào sâu ý nghĩa của Số chủ đạo (tiềm năng bẩm sinh) và Số sứ mệnh nhưng TUYỆT ĐỐI KHÔNG nhắc đến tên chỉ số, viết thật sâu sắc chạm cảm xúc để khơi gợi lý tưởng sống (dài ~120 chữ).",
  "AI_CLOSING_MESSAGE": "Lời kết truyền cảm hứng mạnh mẽ cuối báo cáo (dài ~120 chữ)."
}`;

    // prompt1b: Chi tiết các nghề 1-3 (tách ra để tránh truncate)
    const prompt1b = `${instruction}
Thông tin ứng viên:
${userInfo}

{
  "CAREER_1_KIENTHUC": "3-5 mục kiến thức nền tảng cần có cho nghề 1. Mỗi mục viết ngắn 3-5 từ. Trả về dưới dạng HTML: <li>...</li>.",
  "CAREER_1_KYNANG": "5-6 kỹ năng cần rèn cho nghề 1. Mỗi kỹ năng 2-4 từ. Trả về dạng HTML: <li>...</li>.",
  "CAREER_1_LOTRINH": "3-4 buớc lộ trình học ngắn gọn (nghề ngắn hạn/cao đẳng/đại học). Trả về dạng HTML: <li>...</li>.",
  "CAREER_1_VIECLEM": "4-5 vị trí việc làm cụ thể. Mỗi vị trí 2-4 từ. Trả về dạng HTML: <li>...</li>.",
  "CAREER_1_ADVICE": "1 câu lời khuyên ngắn gọn, truyền cảm hứng cho người bắt đầu theo nghề 1. Tối đa 2 dòng.",
  "CAREER_1_SCIENCE": "Giải thích nền tảng khoa học và yếu tố con người làm cho nghề 1 phù hợp với ứng viên (dài ~80 chữ, không dùng dấu gạch nắng).",
  "CAREER_1_TREND": "Xu hướng phát triển tương lai của nghề 1 tại Việt Nam và thế giới, cơ hội việc làm 5-10 năm tới (dài ~80 chữ, không dùng dấu gạch nắng).",
  "CAREER_1_SKILLS": "3-4 kỹ năng cốt lõi cần tập trung phát triển để thành công trong nghề 1, viết thành đoạn văn mạch lạc (dài ~80 chữ, không dùng dấu gạch nắng).",
  "CAREER_2_KIENTHUC": "3-5 mục kiến thức nền tảng cần có cho nghề 2. Trả về HTML <li>.",
  "CAREER_2_KYNANG": "5-6 kỹ năng cần rèn cho nghề 2. Trả về HTML <li>.",
  "CAREER_2_LOTRINH": "3-4 buớc lộ trình học cho nghề 2. Trả về HTML <li>.",
  "CAREER_2_VIECLEM": "4-5 vị trí việc làm cho nghề 2. Trả về HTML <li>.",
  "CAREER_2_ADVICE": "1 câu lời khuyên ngắn gọn, truyền cảm hứng cho nghề 2.",
  "CAREER_2_SCIENCE": "Nền tảng khoa học và yếu tố con người của nghề 2 phù hợp với ứng viên (~80 chữ, không dùng dấu gạch nắng).",
  "CAREER_2_TREND": "Xu hướng phát triển tương lai của nghề 2 (~80 chữ, không dùng dấu gạch nắng).",
  "CAREER_2_SKILLS": "Kỹ năng cốt lõi cần phát triển cho nghề 2 (~80 chữ, không dùng dấu gạch nắng).",
  "CAREER_3_KIENTHUC": "3-5 mục kiến thức nền tảng cho nghề 3. Trả về HTML <li>.",
  "CAREER_3_KYNANG": "5-6 kỹ năng cần rèn cho nghề 3. Trả về HTML <li>.",
  "CAREER_3_LOTRINH": "3-4 buớc lộ trình học cho nghề 3. Trả về HTML <li>.",
  "CAREER_3_VIECLEM": "4-5 vị trí việc làm cho nghề 3. Trả về HTML <li>.",
  "CAREER_3_ADVICE": "1 câu lời khuyên ngắn gọn cho nghề 3.",
  "CAREER_3_SCIENCE": "Nền tảng khoa học và yếu tố con người của nghề 3 phù hợp với ứng viên (~80 chữ, không dùng dấu gạch nắng).",
  "CAREER_3_TREND": "Xu hướng phát triển tương lai của nghề 3 (~80 chữ, không dùng dấu gạch nắng).",
  "CAREER_3_SKILLS": "Kỹ năng cốt lõi cần phát triển cho nghề 3 (~80 chữ, không dùng dấu gạch nắng)."
}`;


    const prompt2 = `${instruction}
Thông tin ứng viên:
${userInfo}

{
  "CAREER_4_KIENTHUC": "3-5 mục kiến thức nền tảng cho nghề 4. Trả về HTML <li>.",
  "CAREER_4_KYNANG": "5-6 kỹ năng cần rèn cho nghề 4. Trả về HTML <li>.",
  "CAREER_4_LOTRINH": "3-4 bước lộ trình học cho nghề 4. Trả về HTML <li>.",
  "CAREER_4_VIECLEM": "4-5 vị trí việc làm cho nghề 4. Trả về HTML <li>.",
  "CAREER_4_ADVICE": "1 câu lời khuyên ngắn gọn cho nghề 4.",
  "CAREER_4_SCIENCE": "Nền tảng khoa học và yếu tố con người của nghề 4 phù hợp với ứng viên (~80 chữ, không dùng dấu gạch nắng).",
  "CAREER_4_TREND": "Xu hướng phát triển tương lai của nghề 4 (~80 chữ, không dùng dấu gạch nắng).",
  "CAREER_4_SKILLS": "Kỹ năng cốt lõi cần phát triển cho nghề 4 (~80 chữ, không dùng dấu gạch nắng).",
  "CAREER_5_KIENTHUC": "3-5 mục kiến thức nền tảng cho nghề 5. Trả về HTML <li>.",
  "CAREER_5_KYNANG": "5-6 kỹ năng cần rèn cho nghề 5. Trả về HTML <li>.",
  "CAREER_5_LOTRINH": "3-4 bước lộ trình học cho nghề 5. Trả về HTML <li>.",
  "CAREER_5_VIECLEM": "4-5 vị trí việc làm cho nghề 5. Trả về HTML <li>.",
  "CAREER_5_ADVICE": "1 câu lời khuyên ngắn gọn cho nghề 5.",
  "CAREER_5_SCIENCE": "Nền tảng khoa học và yếu tố con người của nghề 5 phù hợp với ứng viên (~80 chữ, không dùng dấu gạch nắng).",
  "CAREER_5_TREND": "Xu hướng phát triển tương lai của nghề 5 (~80 chữ, không dùng dấu gạch nắng).",
  "CAREER_5_SKILLS": "Kỹ năng cốt lõi cần phát triển cho nghề 5 (~80 chữ, không dùng dấu gạch nắng).",
  "WEAKNESS_1_TITLE": "Tên điểm mù / rào cản tâm lý số 1 (ngắn gọn).",
  "WEAKNESS_1_DESC": "Mô tả chi tiết và cách vượt qua rào cản tâm lý số 1 (dài ~80 chữ).",
  "WEAKNESS_2_TITLE": "Tên điểm mù / rào cản tâm lý số 2 (ngắn gọn).",
  "WEAKNESS_2_DESC": "Mô tả chi tiết và cách vượt qua rào cản tâm lý số 2 (dài ~80 chữ).",
  "WEAKNESS_3_TITLE": "Tên điểm mù / rào cản tâm lý số 3 (ngắn gọn).",
  "WEAKNESS_3_DESC": "Mô tả chi tiết và cách vượt qua rào cản tâm lý số 3 (dài ~80 chữ).",
  "RISK_NOW": "Chiến lược quản trị rủi ro ngay hiện tại (0 tháng): hành động cụ thể nhất cần làm ngay hôm nay để không đi sai hướng (dài ~70 chữ).",
  "RISK_SHORT_TERM": "Chiến lược quản trị rủi ro cốt lõi trong ngắn hạn 0-6 tháng (dài ~70 chữ).",
  "RISK_LONG_TERM": "Chiến lược quản trị rủi ro cốt lõi trong dài hạn 6-24 tháng (dài ~70 chữ).",
  "IDEAL_ENVIRONMENT": "Mô tả môi trường làm việc lý tưởng giúp giải phóng năng lực (dài ~80 chữ).",
  "TOXIC_ENVIRONMENT": "Mô tả môi trường gây ức chế, cạm bẫy cần tránh (dài ~80 chữ).",
  "MNC_FIT": "Mức độ phù hợp với Tập đoàn đa quốc gia (Ví dụ: 85%).",
  "MNC_DESC": "Phân tích lý do phù hợp/không phù hợp (dài ~60 chữ).",
  "SOLO_FIT": "Mức độ phù hợp với Solopreneurship (Ví dụ: 90%).",
  "SOLO_DESC": "Phân tích lý do (dài ~60 chữ).",
  "STARTUP_FIT": "Mức độ phù hợp với Startups (Ví dụ: 70%).",
  "STARTUP_DESC": "Phân tích lý do (dài ~60 chữ).",
  "PUBLIC_FIT": "Mức độ phù hợp với Khối Nhà nước (Ví dụ: 40%).",
  "PUBLIC_DESC": "Phân tích lý do (dài ~60 chữ).",
  "PILLAR_1_TITLE": "Tên trụ cột kỹ năng số 1 (Ví dụ: Kỹ năng ABC).",
  "PILLAR_1_DESC": "Mô tả chi tiết tại sao đây là chìa khóa cho sự tự do (dài ~70 chữ).",
  "PILLAR_2_TITLE": "Tên trụ cột kỹ năng số 2.",
  "PILLAR_2_DESC": "Mô tả chi tiết (dài ~70 chữ).",
  "PILLAR_3_TITLE": "Tên trụ cột kỹ năng số 3.",
  "PILLAR_3_DESC": "Mô tả chi tiết (dài ~70 chữ)."
}`;

    let aiTexts: any = {};
    if (cachedAiTexts) {
      aiTexts = cachedAiTexts;
    } else if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const anthropicModelsToTry = [
        "claude-sonnet-5",              // model chính, mới nhất
        "claude-sonnet-4-6",            // fallback 1, ổn định
        "claude-haiku-4-5-20251001"     // fallback 2, rẻ và nhanh
      ];


      async function fetchClaudeJson(promptText: string) {
        let message;
        let errors = [];
        for (const modelName of anthropicModelsToTry) {
          try {
            message = await anthropic.messages.create({
              model: modelName,
              max_tokens: 8192,
              system: "You are a JSON generator. Return ONLY a valid JSON object with no markdown, no code blocks, no explanation. All string values must use proper JSON escaping (backslash-n for newlines, backslash-quote for quotes). Do not truncate the output.",
              messages: [
                { role: "user", content: promptText }
              ]
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
            let geminiErrors = [];

            for (const m of geminiModelsToTry) {
              try {
                const model = genAI.getGenerativeModel({ model: m });
                result = await model.generateContent(
                  "Return ONLY a valid JSON object with no markdown, no code blocks, no explanation.\n\n" + promptText
                );
                break; // success
              } catch (e: any) {
                geminiErrors.push(`${m}: ${e.message}`);
              }
            }

            if (!result) {
              throw new Error(`All Models failed -> Anthropic: ${errors.join(" | ")} | Gemini: ${geminiErrors.join(" | ")}`);
            } else {
              const response = await result.response;
              message = { content: response.text() };
            }
          } else {
            throw new Error("Models failed -> " + errors.join(" | "));
          }
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

        // Strip markdown code fences
        textResult = textResult.replace(/^[\s\S]*?```(?:json)?\s*/i, '').replace(/\s*```[\s\S]*$/i, '').trim();

        // Extract the JSON object
        const jsonMatch = textResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          textResult = jsonMatch[0];
        }

        // Replace literal newlines/tabs INSIDE string values only (safe cleanup)
        textResult = textResult.replace(/[\r\n\t]+/g, ' ');

        try {
          return JSON.parse(textResult);
        } catch (parseErr: any) {
          console.error("JSON.parse failed. Raw AI output (first 500 chars):", textResult.substring(0, 500));
          console.error("Parse error:", parseErr.message);
          throw new Error(`JSON parse failed: ${parseErr.message}`);
        }
      }

      // Chạy 3 prompt song song (prompt1=personality, prompt1b=career 1-3, prompt2=career 4-5+rest)
      const [settled1, settled1b, settled2] = await Promise.allSettled([
        fetchClaudeJson(prompt1),
        fetchClaudeJson(prompt1b),
        fetchClaudeJson(prompt2)
      ]);
      if (settled1.status === 'fulfilled') {
        aiTexts = { ...aiTexts, ...settled1.value };
      } else {
        console.error("⚠️ Prompt1 (personality) AI thất bại:", settled1.reason);
        aiTexts.DEBUG_ERROR = String(settled1.reason?.message || settled1.reason);
      }
      if (settled1b.status === 'fulfilled') {
        aiTexts = { ...aiTexts, ...settled1b.value };
      } else {
        console.error("⚠️ Prompt1b (career 1-3) AI thất bại:", settled1b.reason);
      }
      if (settled2.status === 'fulfilled') {
        aiTexts = { ...aiTexts, ...settled2.value };
      } else {
        console.error("⚠️ Prompt2 (career 4-5+rest) AI thất bại:", settled2.reason);
        if (!aiTexts.DEBUG_ERROR) aiTexts.DEBUG_ERROR = String(settled2.reason?.message || settled2.reason);
      }
    }

    const aiGenerationFailed = !!aiTexts.DEBUG_ERROR;
    if (aiGenerationFailed) {
      console.error("⚠️ AI content generation failed completely:", aiTexts.DEBUG_ERROR);
    }
    const fallback = "Đây là phần đánh giá chuyên sâu dành riêng cho nhóm tính cách của Bạn. Sự nhạy bén và trực giác giúp Bạn thấu hiểu thế giới theo một cách rất riêng.";
    const fallbackRisk = "Hành động quan trọng nhất ngay bây giờ là nghiên cứu kỹ lưỡng về những nghề nghiệp phù hợp và lên kế hoạch học tập cụ thể, rõ ràng. Đừng để sự chần chừ lấy mất cơ hội của bạn.";
    const fallbackWeakness = "Điểm cần cải thiện";
    const fallbackEnv = "Môi trường làm việc lý tưởng là nơi phát huy tối đa năng lực và đam mê của bạn, nơi bạn được tự do sáng tạo và phát triển.";
    const fallbackFit = "Phù hợp";
    if (data.orderCode && getApps().length && !cachedAiTexts && !aiGenerationFailed) {
      try {
        const dbSave = getFirestore();
        await dbSave.collection('orders').doc(String(data.orderCode)).update({
          aiTextsCache: JSON.stringify(aiTexts)
        });
        console.warn(`💾 Đã lưu nội dung AI cho đơn ${data.orderCode} để dùng lại các lần sau.`);
      } catch (e) {
        console.warn("Không lưu được cache nội dung AI:", e);
      }
    }
    const fullData = {

      ...data,

      // ── Key alias fixes: payload dùng tên khác với template ──────────────
      NGAY_SINH:     data.NGAY_SINH     || data.NGAYSINH   || "—",
      DIEN_THOAI:    data.DIEN_THOAI    || data.PHONE       || "—",
      NGAY_XUAT_BAN: data.NGAY_XUAT_BAN || data.NGAYTAO     || new Date().toLocaleDateString('vi-VN'),
      MA_SO_HO_SO:   data.MA_SO_HO_SO   || (data.orderCode ? `NCN-${data.orderCode}` : `NCN-${Date.now()}`),
      EMAIL:         data.EMAIL         || "—",
      // ── TOP 1-5: map PCT → ICI, NICHE → REF, INDUSTRY → FIELD ───────────
      TOP1_ICI:         data.TOP1_ICI         || data.TOP1_PCT      || "—",
      TOP1_ICI_DETAIL:  data.TOP1_ICI_DETAIL  || (data.TOP1_PCT ? `${data.TOP1_PCT}% tương thích` : "—"),
      TOP1_REF:         data.TOP1_REF         || data.TOP1_NICHE    || "—",
      TOP1_FIELD:       data.TOP1_FIELD       || data.TOP1_INDUSTRY || "—",
      TOP1_SUBJECTS:    data.TOP1_SUBJECTS    || "Theo hướng đào tạo phù hợp",
      TOP2_ICI:         data.TOP2_ICI         || data.TOP2_PCT      || "—",
      TOP2_ICI_DETAIL:  data.TOP2_ICI_DETAIL  || (data.TOP2_PCT ? `${data.TOP2_PCT}% tương thích` : "—"),
      TOP2_REF:         data.TOP2_REF         || data.TOP2_NICHE    || "—",
      TOP2_FIELD:       data.TOP2_FIELD       || data.TOP2_INDUSTRY || "—",
      TOP2_SUBJECTS:    data.TOP2_SUBJECTS    || "Theo hướng đào tạo phù hợp",
      TOP3_ICI:         data.TOP3_ICI         || data.TOP3_PCT      || "—",
      TOP3_ICI_DETAIL:  data.TOP3_ICI_DETAIL  || (data.TOP3_PCT ? `${data.TOP3_PCT}% tương thích` : "—"),
      TOP3_REF:         data.TOP3_REF         || data.TOP3_NICHE    || "—",
      TOP3_FIELD:       data.TOP3_FIELD       || data.TOP3_INDUSTRY || "—",
      TOP3_SUBJECTS:    data.TOP3_SUBJECTS    || "Theo hướng đào tạo phù hợp",
      TOP4_ICI:         data.TOP4_ICI         || data.TOP4_PCT      || "—",
      TOP4_ICI_DETAIL:  data.TOP4_ICI_DETAIL  || (data.TOP4_PCT ? `${data.TOP4_PCT}% tương thích` : "—"),
      TOP4_REF:         data.TOP4_REF         || data.TOP4_NICHE    || "—",
      TOP4_FIELD:       data.TOP4_FIELD       || data.TOP4_INDUSTRY || "—",
      TOP4_SUBJECTS:    data.TOP4_SUBJECTS    || "Theo hướng đào tạo phù hợp",
      TOP5_ICI:         data.TOP5_ICI         || data.TOP5_PCT      || "—",
      TOP5_ICI_DETAIL:  data.TOP5_ICI_DETAIL  || (data.TOP5_PCT ? `${data.TOP5_PCT}% tương thích` : "—"),
      TOP5_REF:         data.TOP5_REF         || data.TOP5_NICHE    || "—",
      TOP5_FIELD:       data.TOP5_FIELD       || data.TOP5_INDUSTRY || "—",
      TOP5_SUBJECTS:    data.TOP5_SUBJECTS    || "Theo hướng đào tạo phù hợp",
      // ─────────────────────────────────────────────────────────────────────

      AI_PAGE3_P1: aiTexts.AI_PAGE3_P1 || fallback,
      AI_PAGE3_P2: aiTexts.AI_PAGE3_P2 || fallback,
      AI_PAGE3_P3: aiTexts.AI_PAGE3_P3 || fallback,
      AI_PAGE4_P1: aiTexts.AI_PAGE4_P1 || fallback,
      AI_PAGE4_P2: aiTexts.AI_PAGE4_P2 || fallback,
      AI_PAGE4_P3: aiTexts.AI_PAGE4_P3 || fallback,
      AI_PAGE4_RECOVERY: aiTexts.AI_PAGE4_RECOVERY || fallback,
      AI_PAGE5_P1: aiTexts.AI_PAGE5_P1 || fallback,
      AI_PAGE5_P2: aiTexts.AI_PAGE5_P2 || fallback,
      AI_CLOSING_MESSAGE: aiTexts.AI_CLOSING_MESSAGE || "Hãy dũng cảm bước đi trên con đường của chính mình.",

      // ── TOP 1-5 career details (AI-generated, fallback nếu AI fail) ───────────────
      TOP1_KIENTHUC: aiTexts.CAREER_1_KIENTHUC || `<li>Kiến thức nền tảng về ${data.TOP1_TITLE || 'ngành'}</li><li>Kỹ năng chuyên môn cốt lõi</li><li>Hiểu biết thị trường và xu hướng</li>`,
      TOP1_KYNANG:   aiTexts.CAREER_1_KYNANG   || `<li>Tư duy phân tích</li><li>Giao tiếp hiệu quả</li><li>Giải quyết vấn đề</li><li>Làm việc nhóm</li><li>Quản lý thời gian</li>`,
      TOP1_LOTRINH:  aiTexts.CAREER_1_LOTRINH  || `<li>Học kiến thức nền tảng</li><li>Thực hành qua dự án nhỏ</li><li>Xây dựng portfolio</li><li>Tìm kiếm cơ hội thực tập và việc làm</li>`,
      TOP1_VIECLEM:  aiTexts.CAREER_1_VIECLEM  || `<li>Chuyên viên ${data.TOP1_TITLE || 'ngành'}</li><li>Tư vấn viên</li><li>Quản lý dự án</li><li>Chuyên gia cao cấp</li>`,
      TOP1_ADVICE:   aiTexts.CAREER_1_ADVICE   || `Hãy bắt đầu từ những bước nhỏ nhưng kiên định. Mỗi ngày đầu tư 1-2 giờ học chuyên sâu sẽ tạo ra sự khác biệt lớn sau 3-5 năm.`,
      TOP2_KIENTHUC: aiTexts.CAREER_2_KIENTHUC || `<li>Kiến thức nền tảng về ${data.TOP2_TITLE || 'ngành'}</li><li>Kỹ năng chuyên môn cốt lõi</li><li>Hiểu biết thị trường và xu hướng</li>`,
      TOP2_KYNANG:   aiTexts.CAREER_2_KYNANG   || `<li>Tư duy phân tích</li><li>Giao tiếp hiệu quả</li><li>Giải quyết vấn đề</li><li>Làm việc nhóm</li><li>Quản lý thời gian</li>`,
      TOP2_LOTRINH:  aiTexts.CAREER_2_LOTRINH  || `<li>Học kiến thức nền tảng</li><li>Thực hành qua dự án nhỏ</li><li>Xây dựng portfolio</li><li>Tìm kiếm cơ hội thực tập và việc làm</li>`,
      TOP2_VIECLEM:  aiTexts.CAREER_2_VIECLEM  || `<li>Chuyên viên ${data.TOP2_TITLE || 'ngành'}</li><li>Tư vấn viên</li><li>Quản lý dự án</li><li>Chuyên gia cao cấp</li>`,
      TOP2_ADVICE:   aiTexts.CAREER_2_ADVICE   || `Hãy bắt đầu từ những bước nhỏ nhưng kiên định. Mỗi ngày đầu tư 1-2 giờ học chuyên sâu sẽ tạo ra sự khác biệt lớn sau 3-5 năm.`,
      TOP3_KIENTHUC: aiTexts.CAREER_3_KIENTHUC || `<li>Kiến thức nền tảng về ${data.TOP3_TITLE || 'ngành'}</li><li>Kỹ năng chuyên môn cốt lõi</li><li>Hiểu biết thị trường và xu hướng</li>`,
      TOP3_KYNANG:   aiTexts.CAREER_3_KYNANG   || `<li>Tư duy phân tích</li><li>Giao tiếp hiệu quả</li><li>Giải quyết vấn đề</li><li>Làm việc nhóm</li><li>Quản lý thời gian</li>`,
      TOP3_LOTRINH:  aiTexts.CAREER_3_LOTRINH  || `<li>Học kiến thức nền tảng</li><li>Thực hành qua dự án nhỏ</li><li>Xây dựng portfolio</li><li>Tìm kiếm cơ hội thực tập và việc làm</li>`,
      TOP3_VIECLEM:  aiTexts.CAREER_3_VIECLEM  || `<li>Chuyên viên ${data.TOP3_TITLE || 'ngành'}</li><li>Tư vấn viên</li><li>Quản lý dự án</li><li>Chuyên gia cao cấp</li>`,
      TOP3_ADVICE:   aiTexts.CAREER_3_ADVICE   || `Hãy bắt đầu từ những bước nhỏ nhưng kiên định. Mỗi ngày đầu tư 1-2 giờ học chuyên sâu sẽ tạo ra sự khác biệt lớn sau 3-5 năm.`,
      TOP4_KIENTHUC: aiTexts.CAREER_4_KIENTHUC || `<li>Kiến thức nền tảng về ${data.TOP4_TITLE || 'ngành'}</li><li>Kỹ năng chuyên môn cốt lõi</li><li>Hiểu biết thị trường và xu hướng</li>`,
      TOP4_KYNANG:   aiTexts.CAREER_4_KYNANG   || `<li>Tư duy phân tích</li><li>Giao tiếp hiệu quả</li><li>Giải quyết vấn đề</li><li>Làm việc nhóm</li><li>Quản lý thời gian</li>`,
      TOP4_LOTRINH:  aiTexts.CAREER_4_LOTRINH  || `<li>Học kiến thức nền tảng</li><li>Thực hành qua dự án nhỏ</li><li>Xây dựng portfolio</li><li>Tìm kiếm cơ hội thực tập và việc làm</li>`,
      TOP4_VIECLEM:  aiTexts.CAREER_4_VIECLEM  || `<li>Chuyên viên ${data.TOP4_TITLE || 'ngành'}</li><li>Tư vấn viên</li><li>Quản lý dự án</li><li>Chuyên gia cao cấp</li>`,
      TOP4_ADVICE:   aiTexts.CAREER_4_ADVICE   || `Hãy bắt đầu từ những bước nhỏ nhưng kiên định. Mỗi ngày đầu tư 1-2 giờ học chuyên sâu sẽ tạo ra sự khác biệt lớn sau 3-5 năm.`,
      TOP5_KIENTHUC: aiTexts.CAREER_5_KIENTHUC || `<li>Kiến thức nền tảng về ${data.TOP5_TITLE || 'ngành'}</li><li>Kỹ năng chuyên môn cốt lõi</li><li>Hiểu biết thị trường và xu hướng</li>`,
      TOP5_KYNANG:   aiTexts.CAREER_5_KYNANG   || `<li>Tư duy phân tích</li><li>Giao tiếp hiệu quả</li><li>Giải quyết vấn đề</li><li>Làm việc nhóm</li><li>Quản lý thời gian</li>`,
      TOP5_LOTRINH:  aiTexts.CAREER_5_LOTRINH  || `<li>Học kiến thức nền tảng</li><li>Thực hành qua dự án nhỏ</li><li>Xây dựng portfolio</li><li>Tìm kiếm cơ hội thực tập và việc làm</li>`,
      TOP5_VIECLEM:  aiTexts.CAREER_5_VIECLEM  || `<li>Chuyên viên ${data.TOP5_TITLE || 'ngành'}</li><li>Tư vấn viên</li><li>Quản lý dự án</li><li>Chuyên gia cao cấp</li>`,
      TOP5_ADVICE:   aiTexts.CAREER_5_ADVICE   || `Hãy bắt đầu từ những bước nhỏ nhưng kiên định. Mỗi ngày đầu tư 1-2 giờ học chuyên sâu sẽ tạo ra sự khác biệt lớn sau 3-5 năm.`,
      // Chương II — Phân tích nghề (Sự Giao Thoa Trọn Vẹn)
      CAREER_1_SCIENCE: aiTexts.CAREER_1_SCIENCE || `Nghề ${data.TOP1_TITLE || 'này'} phù hợp với những người có tư duy sáng tạo, khả năng kết nối con người và đam mê xây dựng giá trị thực tiễn cho xã hội. Đây là sự giao thóa độc đáo giữa năng lực tự nhiên và khát vọng sâu thảm của bạn.`,
      CAREER_1_TREND:   aiTexts.CAREER_1_TREND   || `${data.TOP1_TITLE || 'Ngành này'} đang tăng trưởng mạnh tại Việt Nam và toàn cầu, với nhu cầu nhân lực cao chất lượng ngày càng tăng. Cơ hội việc làm trong 5-10 năm tới rất tích cực với mức lương cạnh tranh.`,
      CAREER_1_SKILLS:  aiTexts.CAREER_1_SKILLS  || `Để thành công trong ${data.TOP1_TITLE || 'nghề này'}, bạn cần tập trung phát triển tư duy chiến lược, kỹ năng giao tiếp và thuyết phục, khả năng thích nghi nhanh với công nghệ mới, và năng lực làm việc cộng tác hiệu quả.`,
      CAREER_2_SCIENCE: aiTexts.CAREER_2_SCIENCE || `Nghề ${data.TOP2_TITLE || 'này'} phù hợp với những người có tư duy sáng tạo, khả năng kết nối con người và đam mê xây dựng giá trị thực tiễn cho xã hội.`,
      CAREER_2_TREND:   aiTexts.CAREER_2_TREND   || `${data.TOP2_TITLE || 'Ngành này'} đang tăng trưởng mạnh tại Việt Nam và toàn cầu, cơ hội việc làm trong 5-10 năm tới rất tích cực.`,
      CAREER_2_SKILLS:  aiTexts.CAREER_2_SKILLS  || `Để thành công trong ${data.TOP2_TITLE || 'nghề này'}, bạn cần tập trung phát triển tư duy chiến lược, kỹ năng giao tiếp, khả năng thích nghi và làm việc cộng tác hiệu quả.`,
      CAREER_3_SCIENCE: aiTexts.CAREER_3_SCIENCE || `Nghề ${data.TOP3_TITLE || 'này'} phù hợp với những người có tư duy sáng tạo và đam mê xây dựng giá trị thực tiễn cho xã hội.`,
      CAREER_3_TREND:   aiTexts.CAREER_3_TREND   || `${data.TOP3_TITLE || 'Ngành này'} đang tăng trưởng mạnh tại Việt Nam, cơ hội việc làm trong 5-10 năm tới rất tích cực.`,
      CAREER_3_SKILLS:  aiTexts.CAREER_3_SKILLS  || `Để thành công trong ${data.TOP3_TITLE || 'nghề này'}, bạn cần tôi luỳn tư duy chiến lược, kỹ năng giao tiếp và khả năng làm việc cộng tác hiệu quả.`,
      CAREER_4_SCIENCE: aiTexts.CAREER_4_SCIENCE || `Nghề ${data.TOP4_TITLE || 'này'} phù hợp với những người có tư duy sáng tạo và đam mê xây dựng giá trị thực tiễn.`,
      CAREER_4_TREND:   aiTexts.CAREER_4_TREND   || `${data.TOP4_TITLE || 'Ngành này'} đang tăng trưởng mạnh tại Việt Nam, cơ hội việc làm rất tích cực.`,
      CAREER_4_SKILLS:  aiTexts.CAREER_4_SKILLS  || `Để thành công trong ${data.TOP4_TITLE || 'nghề này'}, bạn cần tôi luỳn tư duy chiến lược và kỹ năng giao tiếp hiệu quả.`,
      CAREER_5_SCIENCE: aiTexts.CAREER_5_SCIENCE || `Nghề ${data.TOP5_TITLE || 'này'} phù hợp với những người có tư duy sáng tạo và đam mê xây dựng giá trị thực tiễn.`,
      CAREER_5_TREND:   aiTexts.CAREER_5_TREND   || `${data.TOP5_TITLE || 'Ngành này'} đang tăng trưởng mạnh, cơ hội việc làm rất tích cực.`,
      CAREER_5_SKILLS:  aiTexts.CAREER_5_SKILLS  || `Để thành công trong ${data.TOP5_TITLE || 'nghề này'}, bạn cần tôi luỳn tư duy chiến lược và kỹ năng giao tiếp hiệu quả.`,
      WEAKNESS_1_TITLE: aiTexts.WEAKNESS_1_TITLE || fallbackWeakness,
      WEAKNESS_1_DESC:  aiTexts.WEAKNESS_1_DESC  || fallback,
      WEAKNESS_2_TITLE: aiTexts.WEAKNESS_2_TITLE || fallbackWeakness,
      WEAKNESS_2_DESC:  aiTexts.WEAKNESS_2_DESC  || fallback,
      WEAKNESS_3_TITLE: aiTexts.WEAKNESS_3_TITLE || fallbackWeakness,
      WEAKNESS_3_DESC:  aiTexts.WEAKNESS_3_DESC  || fallback,
      RISK_NOW:         aiTexts.RISK_NOW         || fallbackRisk,
      RISK_SHORT_TERM:  aiTexts.RISK_SHORT_TERM  || fallbackRisk,
      RISK_LONG_TERM:   aiTexts.RISK_LONG_TERM   || fallbackRisk,
      IDEAL_ENVIRONMENT:  aiTexts.IDEAL_ENVIRONMENT  || fallbackEnv,
      TOXIC_ENVIRONMENT:  aiTexts.TOXIC_ENVIRONMENT  || fallbackEnv,
      MNC_FIT:     aiTexts.MNC_FIT     || fallbackFit,
      MNC_DESC:    aiTexts.MNC_DESC    || fallback,
      SOLO_FIT:    aiTexts.SOLO_FIT    || fallbackFit,
      SOLO_DESC:   aiTexts.SOLO_DESC   || fallback,
      STARTUP_FIT: aiTexts.STARTUP_FIT || fallbackFit,
      STARTUP_DESC:aiTexts.STARTUP_DESC|| fallback,
      PUBLIC_FIT:  aiTexts.PUBLIC_FIT  || fallbackFit,
      PUBLIC_DESC: aiTexts.PUBLIC_DESC || fallback,
      PILLAR_1_TITLE: aiTexts.PILLAR_1_TITLE || "Kỹ năng Chuyên môn",
      PILLAR_1_DESC:  aiTexts.PILLAR_1_DESC  || fallback,
      PILLAR_2_TITLE: aiTexts.PILLAR_2_TITLE || "Kỹ năng Mềm",
      PILLAR_2_DESC:  aiTexts.PILLAR_2_DESC  || fallback,
      PILLAR_3_TITLE: aiTexts.PILLAR_3_TITLE || "Kỹ năng Tư duy",
      PILLAR_3_DESC:  aiTexts.PILLAR_3_DESC  || fallback,
      // ── 3 nghề nên tránh (deterministic từ RIASEC, ghi đè ở trên) ──────────────
      AVOID_1_TITLE:  data.AVOID_1_TITLE  || "Nghề không phù hợp",
      AVOID_1_REASON: data.AVOID_1_REASON || "Nghề này có môi trường làm việc và yêu cầu năng lực không phù hợp với hồ sơ của bạn.",
      AVOID_2_TITLE:  data.AVOID_2_TITLE  || "Nghề không phù hợp",
      AVOID_2_REASON: data.AVOID_2_REASON || "Nghề này có môi trường làm việc và yêu cầu năng lực không phù hợp với hồ sơ của bạn.",
      AVOID_3_TITLE:  data.AVOID_3_TITLE  || "Nghề không phù hợp",
      AVOID_3_REASON: data.AVOID_3_REASON || "Nghề này có môi trường làm việc và yêu cầu năng lực không phù hợp với hồ sơ của bạn.",
    };

    const templatePath = path.join(process.cwd(), 'public', 'bao-cao-pdf-template.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    html = html.replace(/{{(.*?)}}/g, (match, p1) => {
      const key = p1.trim();
      if (fullData[key] !== undefined) {
        return String(fullData[key]).replace(/\n\n/g, '<br><br>');
      }
      return "";
    });

    const isLocal = process.env.NODE_ENV === 'development';

    let browser;
    if (isLocal) {
      browser = await puppeteer.launch({
        args: [],
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
      });
    } else {
      const packUrl = 'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar';
      const executablePath = await chromium.executablePath(packUrl);
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: executablePath || process.env.PUPPETEER_EXECUTABLE_PATH,
        headless: true,
      });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width:100%;font-size:8pt;font-family:'Inter',sans-serif;color:#64748b;font-weight:600;padding-right:20mm;text-align:right;">
          Trang <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
      margin: {
        top: '18mm',
        right: '18mm',
        bottom: '18mm',
        left: '20mm',
      }
    });

    await browser.close();

    let emailErrorResponse = null;
    // 🚀 Send email if email address is provided
    if (data.EMAIL && data.EMAIL !== "Không cung cấp" && process.env.RESEND_API_KEY) {
      try {
        const resendResponse = await resend.emails.send({
          from: 'NCN Academy <no-reply@nghechonnguoi.com>',
          to: [data.EMAIL],
          subject: `[NCN Academy] Báo Cáo Định Vị Ikigai Chiến Lược - ${data.HOTEN}`,
          html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #4f46e5;">Chào ${data.HOTEN},</h2>
              <p>Cảm ơn bạn đã thực hiện bài kiểm tra Khảo sát Định vị Ikigai Chiến lược.</p>
              <p>Đính kèm trong email này là <strong>Báo Cáo PDF Cá Nhân Hóa</strong> chi tiết của riêng bạn.</p>
              <p>Chúc bạn sớm tìm được định hướng sự nghiệp phù hợp và tỏa sáng đúng nơi mình thuộc về!</p>
              <br/>
              <p>Trân trọng,<br/><strong>Đội ngũ NCN Academy</strong></p>
            </div>
          `,
          attachments: [
            {
              filename: 'Bao-Cao-Dinh-Vi-Tuong-Lai.pdf',
              content: Buffer.from(pdfBuffer),
            },
          ],
        });
        if (resendResponse.error) {
          console.error("❌ Resend API returned an error:", resendResponse.error);
          emailErrorResponse = resendResponse.error;
        } else {
          console.warn("✅ Email sent successfully to", data.EMAIL);
        }
      } catch (emailError: any) {
        console.error("❌ Failed to send email:", emailError);
        emailErrorResponse = emailError.message;
      }
    }

    // ✅ Save PDF and return to frontend
    if (data.orderCode && getApps().length) {
      try {
        const db = getFirestore();

        // If AI failed, do NOT serve the broken PDF — block it
        if (aiGenerationFailed) {
          await db.collection('orders').doc(String(data.orderCode)).update({
            pdfDone: false,
            pdfGenerating: false,
            aiGenerationFailed: true,
            aiErrorDetail: String(aiTexts.DEBUG_ERROR)
          });
          console.error(`⚠️ Order ${data.orderCode}: pdfDone=false do hệ thống quá tải.`);
          return NextResponse.json({
            success: false,
            error: "Hệ thống đang quá tải, vui lòng chờ trong giây lát"
          }, { status: 503 });
        }

        // Mark order as done
        await db.collection('orders').doc(String(data.orderCode)).update({
          pdfDone: true,
          pdfGenerating: false,
          aiGenerationFailed: false,
          aiErrorDetail: null
        });
        console.warn(`✅ Marked order ${data.orderCode} as done in Firestore`);

        // Return pdfBase64 directly in API response
        const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
        return NextResponse.json({
          success: true,
          pdfBase64: pdfBase64,
          emailError: emailErrorResponse,
        });
      } catch (err: any) {
        console.error("❌ Failed to update Firestore:", err);
        // Still return the PDF even if Firestore update fails
        const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
        return NextResponse.json({
          success: true,
          pdfBase64: pdfBase64,
          emailError: emailErrorResponse,
        });
      }
    }

    // If orderCode is not present, it's free tier, MUST return buffer!
    if (!data.orderCode) {
      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="Bao-Cao-Dinh-Vi-Tuong-Lai.pdf"',
        },
      });
    }

    // Default return for paid tier
    return NextResponse.json({ success: true, emailError: emailErrorResponse });
  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ success: false, error: "Hệ thống đang quá tải, vui lòng chờ trong giây lát" }, { status: 503 });
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
