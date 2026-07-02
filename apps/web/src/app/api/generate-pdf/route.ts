import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_please_change');

// Allow this API route to run for up to 300 seconds (5 minutes)
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY is not set. Using generic texts.");
    }

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

    const instruction = "Bạn là chuyên gia tư vấn hướng nghiệp xuất sắc. Dựa trên thông tin ứng viên, hãy sinh ra BẮT BUỘC một JSON hợp lệ có các trường sau. YÊU CẦU QUAN TRỌNG TỐI THƯỢNG: 1. Viết thật dài, sâu sắc, ngôn từ đắc nhân tâm, truyền cảm hứng mạnh mẽ. 2. TRONG TOÀN BỘ CÁC MỤC (TỪ TÍNH CÁCH, NGHỀ NGHIỆP, RÀO CẢN ĐẾN MÔI TRƯỜNG), PHẢI LUÔN LỒNG GHÉP VÀ TỔNG HÒA sâu sắc ý nghĩa của 5 khía cạnh cốt lõi (Tiềm năng bẩm sinh, Khao khát nội tại, Sứ mệnh, Tài năng, Đam mê) cùng với MBTI và Holland. 3. KHÔNG BAO GIỜ được gọi đích danh tên các công cụ/chỉ số (như MBTI, Holland, Số chủ đạo, Số sứ mệnh, %...). Phải biến các chỉ số này thành những mô tả phẩm chất con người thật tự nhiên và thấu cảm.";

    const prompt1 = `${instruction}
Thông tin ứng viên:
${userInfo}

{
  "AI_PAGE3_P1": "Phân tích tổng quan về điểm sáng nhất trong tính cách của ứng viên (dài ~100 chữ).",
  "AI_PAGE3_P2": "Phân tích về sự kết hợp giữa các đặc điểm nổi trội (dài ~80 chữ).",
  "AI_PAGE3_P3": "Lời khuyên về môi trường làm việc phù hợp nhất (dài ~80 chữ).",
  "AI_PAGE4_P1": "Phân tích cách tư duy và giải quyết vấn đề của ứng viên (dài ~100 chữ).",
  "AI_PAGE4_P2": "Giá trị cốt lõi ứng viên mang lại cho tổ chức (dài ~80 chữ).",
  "AI_PAGE4_P3": "Rủi ro khi ứng viên đối mặt với áp lực và điểm nghẽn tâm lý (dài ~100 chữ).",
  "AI_PAGE4_RECOVERY": "Lời khuyên để vượt qua áp lực (dài ~60 chữ).",
  "AI_PAGE5_P1": "Lời khen ngợi về năng lực thiên bẩm, tập trung đào sâu vào ý nghĩa của chỉ số Tài năng (ngày sinh) của ứng viên nhưng TUYỆT ĐỐI KHÔNG nhắc đến tên chỉ số hay ngày sinh (dài ~150 chữ).",
  "AI_PAGE5_P2": "Di sản và giá trị dài hạn ứng viên có thể tạo ra cho xã hội, tập trung đào sâu ý nghĩa của Số chủ đạo (tiềm năng bẩm sinh) và Số sứ mệnh nhưng TUYỆT ĐỐI KHÔNG nhắc đến tên chỉ số, viết thật sâu sắc chạm cảm xúc để khơi gợi lý tưởng sống (dài ~120 chữ).",
  "AI_CLOSING_MESSAGE": "Lời kết truyền cảm hứng mạnh mẽ cuối báo cáo (dài ~120 chữ).",
  "CAREER_1_SCIENCE": "Cơ sở khoa học và lý do nghề 1 phù hợp với ứng viên (dài ~60 chữ).",
  "CAREER_1_TREND": "Xu hướng phát triển tương lai của nghề 1 (dài ~60 chữ).",
  "CAREER_1_SKILLS": "Các kỹ năng cần tập trung phát triển cho nghề 1 (dài ~60 chữ).",
  "CAREER_2_SCIENCE": "Cơ sở khoa học và lý do nghề 2 phù hợp với ứng viên (dài ~60 chữ).",
  "CAREER_2_TREND": "Xu hướng phát triển tương lai của nghề 2 (dài ~60 chữ).",
  "CAREER_2_SKILLS": "Các kỹ năng cần tập trung phát triển cho nghề 2 (dài ~60 chữ).",
  "CAREER_3_SCIENCE": "Cơ sở khoa học và lý do nghề 3 phù hợp với ứng viên (dài ~60 chữ).",
  "CAREER_3_TREND": "Xu hướng phát triển tương lai của nghề 3 (dài ~60 chữ).",
  "CAREER_3_SKILLS": "Các kỹ năng cần tập trung phát triển cho nghề 3 (dài ~60 chữ)."
}`;

    const prompt2 = `${instruction}
Thông tin ứng viên:
${userInfo}

{
  "CAREER_4_SCIENCE": "Cơ sở khoa học và lý do nghề 4 phù hợp với ứng viên (dài ~60 chữ).",
  "CAREER_4_TREND": "Xu hướng phát triển tương lai của nghề 4 (dài ~60 chữ).",
  "CAREER_4_SKILLS": "Các kỹ năng cần tập trung phát triển cho nghề 4 (dài ~60 chữ).",
  "CAREER_5_SCIENCE": "Cơ sở khoa học và lý do nghề 5 phù hợp với ứng viên (dài ~60 chữ).",
  "CAREER_5_TREND": "Xu hướng phát triển tương lai của nghề 5 (dài ~60 chữ).",
  "CAREER_5_SKILLS": "Các kỹ năng cần tập trung phát triển cho nghề 5 (dài ~60 chữ).",
  "WEAKNESS_1_TITLE": "Tên điểm mù / rào cản tâm lý số 1 (ngắn gọn).",
  "WEAKNESS_1_DESC": "Mô tả chi tiết và cách vượt qua rào cản tâm lý số 1 (dài ~80 chữ).",
  "WEAKNESS_2_TITLE": "Tên điểm mù / rào cản tâm lý số 2 (ngắn gọn).",
  "WEAKNESS_2_DESC": "Mô tả chi tiết và cách vượt qua rào cản tâm lý số 2 (dài ~80 chữ).",
  "WEAKNESS_3_TITLE": "Tên điểm mù / rào cản tâm lý số 3 (ngắn gọn).",
  "WEAKNESS_3_DESC": "Mô tả chi tiết và cách vượt qua rào cản tâm lý số 3 (dài ~80 chữ).",
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
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const modelsToTry = [
        "claude-sonnet-5",
        "claude-5-sonnet-latest",
        "claude-3-5-sonnet-20240620",
        "claude-3-5-sonnet-latest"
      ];

      async function fetchClaudeJson(promptText: string) {
        let message;
        let errors = [];
        for (const modelName of modelsToTry) {
          try {
            message = await anthropic.messages.create({
              model: modelName,
              max_tokens: 4096,
              system: "Bạn chỉ được phép trả về duy nhất một object JSON hợp lệ, không có code blocks, không có text dư thừa.",
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
          throw new Error("Models failed -> " + errors.join(" | "));
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
        
        return JSON.parse(textResult);
      }

      try {
        const [res1, res2] = await Promise.all([
          fetchClaudeJson(prompt1),
          fetchClaudeJson(prompt2)
        ]);
        aiTexts = { ...res1, ...res2 };
      } catch (e: any) {
        console.error("Anthropic API Error:", e);
        aiTexts.DEBUG_ERROR = String(e.message || e);
      }
    }

    const fallback = aiTexts.DEBUG_ERROR ? `[LỖI HỆ THỐNG AI: ${aiTexts.DEBUG_ERROR}] Vui lòng chụp ảnh màn hình này gửi cho đội kỹ thuật.` : "Đây là phần đánh giá chuyên sâu dành riêng cho nhóm tính cách của Bạn. Sự nhạy bén và trực giác giúp Bạn thấu hiểu thế giới theo một cách rất riêng.";
    const fullData = {
      ...data,
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
      CAREER_1_SCIENCE: aiTexts.CAREER_1_SCIENCE || "",
      CAREER_1_TREND: aiTexts.CAREER_1_TREND || "",
      CAREER_1_SKILLS: aiTexts.CAREER_1_SKILLS || "",
      CAREER_2_SCIENCE: aiTexts.CAREER_2_SCIENCE || "",
      CAREER_2_TREND: aiTexts.CAREER_2_TREND || "",
      CAREER_2_SKILLS: aiTexts.CAREER_2_SKILLS || "",
      CAREER_3_SCIENCE: aiTexts.CAREER_3_SCIENCE || "",
      CAREER_3_TREND: aiTexts.CAREER_3_TREND || "",
      CAREER_3_SKILLS: aiTexts.CAREER_3_SKILLS || "",
      CAREER_4_SCIENCE: aiTexts.CAREER_4_SCIENCE || "",
      CAREER_4_TREND: aiTexts.CAREER_4_TREND || "",
      CAREER_4_SKILLS: aiTexts.CAREER_4_SKILLS || "",
      CAREER_5_SCIENCE: aiTexts.CAREER_5_SCIENCE || "",
      CAREER_5_TREND: aiTexts.CAREER_5_TREND || "",
      CAREER_5_SKILLS: aiTexts.CAREER_5_SKILLS || "",
      WEAKNESS_1_TITLE: aiTexts.WEAKNESS_1_TITLE || "",
      WEAKNESS_1_DESC: aiTexts.WEAKNESS_1_DESC || "",
      WEAKNESS_2_TITLE: aiTexts.WEAKNESS_2_TITLE || "",
      WEAKNESS_2_DESC: aiTexts.WEAKNESS_2_DESC || "",
      WEAKNESS_3_TITLE: aiTexts.WEAKNESS_3_TITLE || "",
      WEAKNESS_3_DESC: aiTexts.WEAKNESS_3_DESC || "",
      RISK_SHORT_TERM: aiTexts.RISK_SHORT_TERM || "",
      RISK_LONG_TERM: aiTexts.RISK_LONG_TERM || "",
      IDEAL_ENVIRONMENT: aiTexts.IDEAL_ENVIRONMENT || "",
      TOXIC_ENVIRONMENT: aiTexts.TOXIC_ENVIRONMENT || "",
      MNC_FIT: aiTexts.MNC_FIT || "",
      MNC_DESC: aiTexts.MNC_DESC || "",
      SOLO_FIT: aiTexts.SOLO_FIT || "",
      SOLO_DESC: aiTexts.SOLO_DESC || "",
      STARTUP_FIT: aiTexts.STARTUP_FIT || "",
      STARTUP_DESC: aiTexts.STARTUP_DESC || "",
      PUBLIC_FIT: aiTexts.PUBLIC_FIT || "",
      PUBLIC_DESC: aiTexts.PUBLIC_DESC || "",
      PILLAR_1_TITLE: aiTexts.PILLAR_1_TITLE || "",
      PILLAR_1_DESC: aiTexts.PILLAR_1_DESC || "",
      PILLAR_2_TITLE: aiTexts.PILLAR_2_TITLE || "",
      PILLAR_2_DESC: aiTexts.PILLAR_2_DESC || "",
      PILLAR_3_TITLE: aiTexts.PILLAR_3_TITLE || "",
      PILLAR_3_DESC: aiTexts.PILLAR_3_DESC || "",
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

    // 🚀 Send email if email address is provided
    if (data.EMAIL && data.EMAIL !== "Không cung cấp" && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'NCN Academy <no-reply@ncnacademy.com>', // User needs to verify domain in Resend
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
              content: pdfBuffer,
            },
          ],
        });
        console.log("✅ Email sent successfully to", data.EMAIL);
      } catch (emailError) {
        console.error("❌ Failed to send email:", emailError);
        // We don't throw here to ensure the user still gets the PDF download even if email fails
      }
    }

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Bao-Cao-Dinh-Vi-Tuong-Lai.pdf"',
      },
    });

  } catch (error: any) {
    console.error("PDF Generation Error:", error);
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
