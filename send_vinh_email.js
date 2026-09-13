/**
 * Gửi email báo cáo cho Nguyễn Thành Vinh (kakaxebuyt@gmail.com)
 * Gọi production API để generate PDF + tự động gửi email qua Resend
 */
const https = require('https');
const fs    = require('fs');

const payload = {
  HOTEN:         "Nguyễn Thành Vinh",
  EMAIL:         "kakaxebuyt@gmail.com",
  DIEN_THOAI:    "0947374563",
  NGAY_SINH:     "07/05/2015",
  MA_SO_HO_SO:   "NCN-2159",
  NGAY_XUAT_BAN: "11/8/2026",
  MBTI:     "INFP",
  HOLLAND:  "ESA",
  LIFEPATH: 2,
  SOUL:     9,
  MISSION:  1,
  TALENT:   7,
  PASSION:  5,
  R_PCT: 10, I_PCT: 20, A_PCT: 80, S_PCT: 90, E_PCT: 100, C_PCT: 15,

  TOP1_TITLE:      "Nhà báo / Người làm truyền thông (quản lý quan hệ công chúng PR cho thương hiệu, xây dựng & điều hành kênh mạng xã hội, tổ chức sự kiện truyền thông)",
  TOP1_NICHE:      "Nhà sáng tạo Nội dung Số & Chiến lược gia Kênh Đa nền tảng",
  TOP1_REF:        "Truyền thông đa phương tiện",
  TOP1_FIELD:      "Truyền thông & Báo chí",
  TOP1_ICI:        98.11,
  TOP1_ICI_DETAIL: "Id:92 · Ni:100 · Mk:86.1",
  TOP1_SUBJECTS:   "D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa)",
  TOP1_KNOWLEDGE: "", TOP1_ADVICE: "",

  TOP2_TITLE:      "Chuyên gia Marketing / Kinh doanh (bán hàng & phát triển khách hàng B2B, xây dựng mạng lưới đối tác, xây dựng thương hiệu cá nhân)",
  TOP2_NICHE:      "CEO Startup & Nhà sáng lập Khởi nghiệp",
  TOP2_REF:        "Quản trị & Marketing",
  TOP2_FIELD:      "Kinh doanh & Marketing",
  TOP2_ICI:        95.73,
  TOP2_ICI_DETAIL: "Id:87 · Ni:100 · Mk:96.9",
  TOP2_SUBJECTS:   "D01 / A01 (Toán - Văn - Anh / Toán - Lý - Anh)",
  TOP2_KNOWLEDGE: "", TOP2_ADVICE: "",

  TOP3_TITLE:      "Nhà đào tạo / Facilitator Doanh nghiệp (đào tạo kỹ năng lãnh đạo & văn hóa doanh nghiệp, thiết kế workshop & chương trình phát triển nhân viên)",
  TOP3_NICHE:      "Chuyên gia Chiến lược Định vị Nghề nghiệp & Thương hiệu Cá nhân",
  TOP3_REF:        "Giáo dục & Đào tạo",
  TOP3_FIELD:      "Đào tạo & Phát triển",
  TOP3_ICI:        93.73,
  TOP3_ICI_DETAIL: "Id:93 · Ni:100 · Mk:86.2",
  TOP3_SUBJECTS:   "D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa)",
  TOP3_KNOWLEDGE: "", TOP3_ADVICE: "",

  TOP4_TITLE:      "Nghệ sĩ / Nhà Thiết kế (điều hành studio sáng tạo, kinh doanh tác phẩm nghệ thuật & IP sáng tạo, xây dựng thương hiệu nghệ sĩ)",
  TOP4_NICHE:      "Đạo diễn Phim ngắn TVC & Branded Content",
  TOP4_REF:        "Nghệ thuật & Sáng tạo",
  TOP4_FIELD:      "Nghệ thuật & Sáng tạo",
  TOP4_ICI:        93.48,
  TOP4_ICI_DETAIL: "Id:84 · Ni:100 · Mk:87.2",
  TOP4_SUBJECTS:   "H00 / D01 (Năng khiếu / Toán - Văn - Anh)",
  TOP4_KNOWLEDGE: "", TOP4_ADVICE: "",

  TOP5_TITLE:      "Career Coach & Chuyên gia Tư vấn Phát triển Cá nhân (hướng nghiệp học sinh, coaching định hướng sự nghiệp, tư vấn tâm lý học đường)",
  TOP5_NICHE:      "Career Coach & Chiến lược gia Phát triển Bản thân",
  TOP5_REF:        "Tư vấn & Phát triển Cá nhân",
  TOP5_FIELD:      "Tâm lý & Coaching",
  TOP5_ICI:        91.77,
  TOP5_ICI_DETAIL: "Id:88.5 · Ni:95 · Mk:99.5",
  TOP5_SUBJECTS:   "D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa)",
  TOP5_KNOWLEDGE: "", TOP5_ADVICE: "",
};

function callApi(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'www.nghechonnguoi.com',
      path: '/api/generate-pdf',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 300000,
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve({ status: res.statusCode, buf, headers: res.headers });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('📧 Đang gọi API generate-pdf + gửi email...');
  console.log(`   To: ${payload.EMAIL}`);
  console.log(`   Name: ${payload.HOTEN}`);
  console.log();

  const { status, buf, headers } = await callApi(payload);
  const contentType = headers['content-type'] || '';

  console.log(`HTTP ${status}`);
  console.log(`Content-Type: ${contentType}`);
  console.log(`Size: ${(buf.length / 1024).toFixed(1)} KB`);

  if (status === 200) {
    if (contentType.includes('application/pdf') || buf.slice(0, 4).toString() === '%PDF') {
      // PDF returned directly → save it (email đã gửi rồi)
      const outPath = 'D:\\NCN-Academy\\BaoCao_NguyenThanhVinh_NCN2159_final.pdf';
      fs.writeFileSync(outPath, buf);
      console.log(`\n✅ PDF đã lưu: ${outPath}`);
      console.log(`✅ Email đã được gửi tự động đến: ${payload.EMAIL}`);
    } else {
      const text = buf.toString('utf8');
      try {
        const json = JSON.parse(text);
        console.log('Response JSON:', JSON.stringify(json, null, 2));
        if (json.success) {
          console.log(`\n✅ Email đã gửi thành công đến: ${payload.EMAIL}`);
          if (json.emailError) {
            console.log(`⚠️  Email error: ${json.emailError}`);
          }
        }
      } catch {
        console.log('Response text:', text.slice(0, 500));
      }
    }
  } else {
    console.log('❌ Error:', buf.toString('utf8').slice(0, 500));
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
