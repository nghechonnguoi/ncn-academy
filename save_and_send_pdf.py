import sys, urllib.request, json, urllib.error

ORDER_CODE = "9807"
EMAIL = "tuvanhuongnghiepchonnghe1@gmail.com"
PDF_PATH = f"Bao-Cao-{ORDER_CODE}.pdf"

# Bước 1: Lấy payload
print("[1] Lay payload...")
req = urllib.request.Request(
    f"https://www.nghechonnguoi.com/api/admin/retry-pdf?orderCode={ORDER_CODE}&payload=true"
)
with urllib.request.urlopen(req, timeout=30) as r:
    data = json.loads(r.read())

payload = data.get("payload", {})
print(f"    Fields: {len(payload)}, Email: {data.get('email')}")

# Bước 2: Gọi generate-pdf và lưu file PDF
print(f"\n[2] Goi generate-pdf va luu file...")
body = json.dumps(payload).encode("utf-8")
req2 = urllib.request.Request(
    "https://www.nghechonnguoi.com/api/generate-pdf",
    data=body,
    headers={"Content-Type": "application/json"},
    method="POST"
)

with urllib.request.urlopen(req2, timeout=300) as r2:
    raw = r2.read()

if raw[:4] == b'%PDF':
    with open(PDF_PATH, 'wb') as f:
        f.write(raw)
    print(f"    PDF luu thanh cong: {PDF_PATH} ({len(raw):,} bytes)")
else:
    # JSON response
    result = json.loads(raw.decode("utf-8", errors="replace"))
    print(f"    JSON response: {json.dumps(result, ensure_ascii=False)[:300]}")
    sys.exit(0)

# Bước 3: Gửi email thủ công qua Resend
print(f"\n[3] Gui email voi PDF dinh kem...")
import base64

RESEND_API_KEY = input("Nhap RESEND_API_KEY: ").strip()

pdf_b64 = base64.b64encode(raw).decode("utf-8")
name = payload.get("HOTEN", "Bạn")

email_body = json.dumps({
    "from": "NCN Academy <baocao@nghechonnguoi.com>",
    "to": [EMAIL],
    "subject": f"[NCN Academy] Báo cáo định vị nghề nghiệp của {name}",
    "html": f"""
    <div style="font-family:Arial;padding:20px;max-width:600px">
        <h2 style="color:#1a1040">Xin chào {name}! 👋</h2>
        <p>Cảm ơn bạn đã tin tưởng NCN Academy.</p>
        <p>Báo cáo định vị nghề nghiệp cá nhân hóa của bạn đã được đính kèm trong email này.</p>
        <p style="color:#666;font-size:13px">Mã đơn hàng: NCN-{ORDER_CODE}</p>
        <hr>
        <p style="color:#888;font-size:12px">NCN Academy · nghechonnguoi.com</p>
    </div>
    """,
    "attachments": [{
        "filename": f"Bao-Cao-NCN-{ORDER_CODE}.pdf",
        "content": pdf_b64
    }]
}).encode("utf-8")

resend_req = urllib.request.Request(
    "https://api.resend.com/emails",
    data=email_body,
    headers={
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    },
    method="POST"
)

try:
    with urllib.request.urlopen(resend_req, timeout=30) as r3:
        result = json.loads(r3.read())
    print(f"    Email da gui! ID: {result.get('id')}")
    print(f"    Gui den: {EMAIL}")
except urllib.error.HTTPError as e:
    err = e.read().decode()
    print(f"    Loi gui email: {e.code} - {err}")
