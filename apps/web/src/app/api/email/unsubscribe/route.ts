import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/auth-firebase";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return new NextResponse(renderHTML("Lỗi", "Thiếu thông tin email."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const db = getDb();
    const snapshot = await db
      .collection("leads")
      .where("email", "==", email)
      .get();

    if (snapshot.empty) {
      return new NextResponse(
        renderHTML(
          "Không tìm thấy",
          "Email này không có trong hệ thống."
        ),
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Cập nhật tất cả leads có email này
    for (const doc of snapshot.docs) {
      await doc.ref.update({
        "emailSequence.unsubscribed": true,
        "emailSequence.nextSendAt": null,
      });
    }

    return new NextResponse(
      renderHTML(
        "Đã huỷ thành công ✅",
        `Bạn sẽ không nhận thêm email từ Nghề Chọn Người nữa.<br><br>
         Nếu đây là nhầm lẫn, bạn có thể liên hệ
         <a href="mailto:tuvanhuongnghiepchonnghe@gmail.com">tuvanhuongnghiepchonnghe@gmail.com</a>
         để đăng ký lại.`
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new NextResponse(
      renderHTML("Lỗi hệ thống", "Có lỗi xảy ra. Vui lòng thử lại sau."),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

function renderHTML(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Nghề Chọn Người</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
      color: #333;
    }
    .card {
      background: white;
      padding: 40px;
      border-radius: 10px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #0e0e1a; font-size: 24px; }
    p { color: #666; line-height: 1.6; }
    a { color: #e8654a; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
