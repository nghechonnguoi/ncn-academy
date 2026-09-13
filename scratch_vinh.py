import sys, io, json, urllib.request, urllib.error, base64
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

payload = {
    "HOTEN": "Nguyễn Thành Vinh",
    "EMAIL": "kakaxebuyt@gmail.com",
    "DIEN_THOAI": "0947374563",
    "NGAY_SINH": "07/05/2015",
    "MA_SO_HO_SO": "NCN-2159",
    "NGAY_XUAT_BAN": "11/8/2026",
    "MBTI": "INFP", "HOLLAND": "ESA",
    "LIFEPATH": 2, "SOUL": 9, "MISSION": 1, "TALENT": 7, "PASSION": 5,
    "R_PCT": 10, "I_PCT": 20, "A_PCT": 80, "S_PCT": 90, "E_PCT": 100, "C_PCT": 15,
    "TOP1_TITLE": "Nhà báo / Người làm truyền thông (quản lý quan hệ công chúng PR cho thương hiệu, xây dựng & điều hành kênh mạng xã hội, tổ chức sự kiện truyền thông)",
    "TOP1_NICHE": "Nhà sáng tạo Nội dung Số & Chiến lược gia Kênh Đa nền tảng",
    "TOP1_REF": "Truyền thông đa phương tiện", "TOP1_FIELD": "Truyền thông & Báo chí",
    "TOP1_ICI": 98.11, "TOP1_ICI_DETAIL": "Id:92 · Ni:100 · Mk:86.1",
    "TOP1_SUBJECTS": "D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa)", "TOP1_KNOWLEDGE": "", "TOP1_ADVICE": "",
    "TOP2_TITLE": "Chuyên gia Marketing / Kinh doanh (bán hàng & phát triển khách hàng B2B, xây dựng mạng lưới đối tác, xây dựng thương hiệu cá nhân)",
    "TOP2_NICHE": "CEO Startup & Nhà sáng lập Khởi nghiệp",
    "TOP2_REF": "Quản trị & Marketing", "TOP2_FIELD": "Kinh doanh & Marketing",
    "TOP2_ICI": 95.73, "TOP2_ICI_DETAIL": "Id:87 · Ni:100 · Mk:96.9",
    "TOP2_SUBJECTS": "D01 / A01 (Toán - Văn - Anh / Toán - Lý - Anh)", "TOP2_KNOWLEDGE": "", "TOP2_ADVICE": "",
    "TOP3_TITLE": "Nhà đào tạo / Facilitator Doanh nghiệp (đào tạo kỹ năng lãnh đạo & văn hóa doanh nghiệp, thiết kế workshop & chương trình phát triển nhân viên)",
    "TOP3_NICHE": "Chuyên gia Chiến lược Định vị Nghề nghiệp & Thương hiệu Cá nhân",
    "TOP3_REF": "Giáo dục & Đào tạo", "TOP3_FIELD": "Đào tạo & Phát triển",
    "TOP3_ICI": 93.73, "TOP3_ICI_DETAIL": "Id:93 · Ni:100 · Mk:86.2",
    "TOP3_SUBJECTS": "D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa)", "TOP3_KNOWLEDGE": "", "TOP3_ADVICE": "",
    "TOP4_TITLE": "Nghệ sĩ / Nhà Thiết kế (điều hành studio sáng tạo, kinh doanh tác phẩm nghệ thuật & IP sáng tạo, xây dựng thương hiệu nghệ sĩ)",
    "TOP4_NICHE": "Đạo diễn Phim ngắn TVC & Branded Content",
    "TOP4_REF": "Nghệ thuật & Sáng tạo", "TOP4_FIELD": "Nghệ thuật & Sáng tạo",
    "TOP4_ICI": 93.48, "TOP4_ICI_DETAIL": "Id:84 · Ni:100 · Mk:87.2",
    "TOP4_SUBJECTS": "H00 / D01 (Năng khiếu / Toán - Văn - Anh)", "TOP4_KNOWLEDGE": "", "TOP4_ADVICE": "",
    "TOP5_TITLE": "Career Coach & Chuyên gia Tư vấn Phát triển Cá nhân (hướng nghiệp học sinh, coaching định hướng sự nghiệp, tư vấn tâm lý học đường)",
    "TOP5_NICHE": "Career Coach & Chiến lược gia Phát triển Bản thân",
    "TOP5_REF": "Tư vấn & Phát triển Cá nhân", "TOP5_FIELD": "Tâm lý & Coaching",
    "TOP5_ICI": 91.77, "TOP5_ICI_DETAIL": "Id:88.5 · Ni:95 · Mk:99.5",
    "TOP5_SUBJECTS": "D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa)", "TOP5_KNOWLEDGE": "", "TOP5_ADVICE": "",
}

print(f"Đang gọi production API...")
print(f"To: {payload['EMAIL']} | Name: {payload['HOTEN']}")

body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
req = urllib.request.Request(
    "https://www.nghechonnguoi.com/api/generate-pdf",
    data=body,
    headers={'Content-Type': 'application/json', 'User-Agent': 'NCN-Admin/1.0'},
    method='POST'
)

try:
    with urllib.request.urlopen(req, timeout=300) as resp:
        status = resp.status
        buf = resp.read()
        ct  = resp.headers.get('Content-Type', '')
        print(f"HTTP {status} | Content-Type: {ct} | Size: {len(buf)//1024} KB")

        if status == 200:
            if buf[:4] == b'%PDF':
                out = r'D:\NCN-Academy\BaoCao_NguyenThanhVinh_NCN2159_final.pdf'
                with open(out, 'wb') as f: f.write(buf)
                print(f"\n✅ PDF đã lưu: {out}")
                print(f"✅ Email đã gửi tự động đến: {payload['EMAIL']}")
                print(f"   (Server gửi email trước khi trả về PDF buffer)")
            else:
                rj = json.loads(buf)
                print(f"Response: {rj}")
                if rj.get('success'):
                    print(f"\n✅ Email đã gửi đến: {payload['EMAIL']}")
                    if rj.get('emailError'):
                        print(f"⚠️ Email error: {rj['emailError']}")

except urllib.error.HTTPError as e:
    print(f"❌ HTTP {e.code}: {e.read().decode()[:300]}")
except Exception as ex:
    print(f"❌ {ex}")
