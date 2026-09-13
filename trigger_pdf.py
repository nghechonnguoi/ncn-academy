import sys
import urllib.request
import json
import urllib.parse

ORDER_CODE = "9807"

print(f"[1/3] Lay payload tu Firestore cho order {ORDER_CODE}...")
url = f"https://www.nghechonnguoi.com/api/admin/retry-pdf?orderCode={ORDER_CODE}&payload=true"
req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=30) as resp:
    data = json.loads(resp.read())

if "error" in data:
    print(f"LOI: {data['error']}")
    sys.exit(1)

payload = data.get("payload", {})
email = data.get("email", "?")
status = data.get("status", "?")
print(f"    Order status: {status}")
print(f"    Email: {email}")
print(f"    Payload keys: {list(payload.keys())[:10]}")

if not payload:
    print("KHONG CO PAYLOAD - khong the tao PDF")
    sys.exit(1)

print(f"\n[2/3] Goi generate-pdf cho order {ORDER_CODE} (co the mat 2-5 phut)...")
pdf_url = "https://www.nghechonnguoi.com/api/generate-pdf"
body = json.dumps(payload).encode("utf-8")
req2 = urllib.request.Request(
    pdf_url,
    data=body,
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    with urllib.request.urlopen(req2, timeout=300) as resp2:
        result = json.loads(resp2.read())
    print(f"\n[3/3] KET QUA:")
    print(json.dumps(result, indent=2, ensure_ascii=False)[:500])
except Exception as e:
    print(f"LOI khi goi generate-pdf: {e}")
    print("Co the PDF van dang duoc tao - kiem tra email cua khach")
