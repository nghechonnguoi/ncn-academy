import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import Anthropic from '@anthropic-ai/sdk';

// Allow this API route to run for up to 60 seconds
export const maxDuration = 60;


export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY is not set. Using generic texts.");
    }

    const prompt = `Bạn là chuyên gia tư vấn hướng nghiệp xuất sắc. Dựa trên thông tin của ứng viên sau:
- Tên: ${data.HOTEN}
- Nhóm tính cách MBTI: ${data.MBTI}
- Mã Holland: ${data.HOLLAND}
- Điểm Holland: R(${data.R_PCT}%), I(${data.I_PCT}%), A(${data.A_PCT}%), S(${data.S_PCT}%), E(${data.E_PCT}%), C(${data.C_PCT}%)

Hãy sinh ra BẮT BUỘC một JSON hợp lệ có các trường sau (viết bằng tiếng Việt, ngôn từ truyền cảm hứng, thấu hiểu, mang tính chữa lành và định vị sự nghiệp sâu sắc):
{
  "AI_PAGE3_P1": "Phân tích tổng quan về điểm sáng nhất trong tính cách của ứng viên (dài ~100 chữ).",
  "AI_PAGE3_P2": "Phân tích về sự kết hợp giữa các đặc điểm nổi trội (dài ~80 chữ).",
  "AI_PAGE3_P3": "Lời khuyên về môi trường làm việc phù hợp nhất (dài ~80 chữ).",
  "AI_PAGE4_P1": "Phân tích cách tư duy và giải quyết vấn đề của ứng viên (dài ~100 chữ).",
  "AI_PAGE4_P2": "Giá trị cốt lõi ứng viên mang lại cho tổ chức (dài ~80 chữ).",
  "AI_PAGE4_P3": "Rủi ro khi ứng viên đối mặt với áp lực và điểm nghẽn tâm lý (dài ~100 chữ).",
  "AI_PAGE4_RECOVERY": "Lời khuyên để vượt qua áp lực (dài ~60 chữ).",
  "AI_PAGE5_P1": "Lời khen ngợi về năng lực thiên bẩm và sức mạnh sâu thẳm của ứng viên (dài ~150 chữ).",
  "AI_PAGE5_P2": "Di sản và giá trị dài hạn ứng viên có thể tạo ra (dài ~80 chữ).",
  "AI_CLOSING_MESSAGE": "Lời kết truyền cảm hứng mạnh mẽ cuối báo cáo (dài ~120 chữ)."
}`;

    let aiTexts: any = {};
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const modelsToTry = [
          "claude-sonnet-5",
          "claude-5-sonnet-latest",
          "claude-3-5-sonnet-20240620",
          "claude-3-5-sonnet-latest"
        ];
        
        let message;
        for (const modelName of modelsToTry) {
          try {
            message = await anthropic.messages.create({
              model: modelName,
              max_tokens: 1500,
              temperature: 0.7,
              system: "Bạn là chuyên gia tư vấn hướng nghiệp xuất sắc. Bạn chỉ được phép trả về duy nhất một object JSON hợp lệ, không có code blocks, không có text dư thừa.",
              messages: [
                { role: "user", content: prompt }
              ]
            });
            console.log("Successfully used model:", modelName);
            break; // Success!
          } catch (err: any) {
            console.warn(`Model ${modelName} failed:`, err.message);
          }
        }

        if (!message) {
          throw new Error("All Anthropic models failed.");
        }
        
        let textResult = (message.content[0] as any).text;
        const jsonMatch = textResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          textResult = jsonMatch[0];
        }
        aiTexts = JSON.parse(textResult);
      } catch (e: any) {
        console.error("Anthropic API Error:", e);
        aiTexts.DEBUG_ERROR = String(e.message || e);
      }
    }

    // Fallback if AI fails or no key
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
    };

    // Load HTML Template
    const templatePath = path.join(process.cwd(), 'public', 'bao-cao-pdf-template.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    // Replace variables
    html = html.replace(/{{(.*?)}}/g, (match, p1) => {
      const key = p1.trim();
      if (fullData[key] !== undefined) {
        return String(fullData[key]).replace(/\n\n/g, '<br><br>');
      }
      return "";
    });

    // Generate PDF using Puppeteer
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
