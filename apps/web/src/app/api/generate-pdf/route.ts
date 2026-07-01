import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import OpenAI from 'openai';

// Allow this API route to run for up to 60 seconds
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY is not set. Using generic texts.");
    }

    const prompt = `Bạn là chuyên gia tư vấn hướng nghiệp. Dựa trên thông tin của ứng viên:
- Tên: ${data.HOTEN}
- Nhóm tính cách MBTI: ${data.MBTI}
- Mã Holland: ${data.HOLLAND}
- Điểm Holland: R(${data.R_PCT}%), I(${data.I_PCT}%), A(${data.A_PCT}%), S(${data.S_PCT}%), E(${data.E_PCT}%), C(${data.C_PCT}%)

Hãy sinh ra một JSON có các trường sau (ngôn từ truyền cảm hứng):
- AI_PAGE3_P1: Phân tích tổng quan điểm sáng nhất trong tính cách (100 chữ).
- AI_PAGE3_P2: Phân tích sự kết hợp giữa các đặc điểm (80 chữ).
- AI_PAGE3_P3: Lời khuyên môi trường làm việc phù hợp (80 chữ).
- AI_PAGE4_P1: Phân tích cách tư duy giải quyết vấn đề (100 chữ).
- AI_PAGE4_P2: Giá trị cốt lõi mang lại cho tổ chức (80 chữ).
- AI_PAGE4_P3: Rủi ro điểm nghẽn tâm lý (100 chữ).
- AI_PAGE4_RECOVERY: Lời khuyên vượt qua áp lực (60 chữ).
- AI_PAGE5_P1: Khen ngợi năng lực thiên bẩm (150 chữ).
- AI_PAGE5_P2: Giá trị dài hạn có thể tạo ra (80 chữ).
- AI_CLOSING_MESSAGE: Lời kết truyền cảm hứng (120 chữ).`;

    let aiTexts: any = {};
    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        });
        aiTexts = JSON.parse(completion.choices[0].message.content || '{}');
      } catch (e) {
        console.error("OpenAI Error:", e);
      }
    }

    const fallback = "Sự nhạy bén và trực giác giúp Bạn thấu hiểu thế giới theo một cách rất riêng.";
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
      AI_CLOSING_MESSAGE: aiTexts.AI_CLOSING_MESSAGE || "Hãy dũng cảm bước đi trên con đường của mình.",
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

    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath || process.env.PUPPETEER_EXECUTABLE_PATH,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

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
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Bao-Cao-Dinh-Vi-Tuong-Lai.pdf"',
      },
    });

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
