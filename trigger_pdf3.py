import sys, urllib.request, json, urllib.error

ORDER_CODE = "9807"

# Bước 1: Lấy payload từ Firestore
print("[1] Lay payload tu Firestore...")
req = urllib.request.Request(
    f"https://www.nghechonnguoi.com/api/admin/retry-pdf?orderCode={ORDER_CODE}&payload=true"
)
with urllib.request.urlopen(req, timeout=30) as r:
    data = json.loads(r.read())

payload = data.get("payload", {})
print(f"    Fields: {len(payload)}, Email: {data.get('email')}, Status: {data.get('status')}")

if not payload:
    print("KHONG CO PAYLOAD!")
    sys.exit(1)

# QUAN TRONG: Thêm orderCode vào payload để generate-pdf gửi email + cập nhật Firestore
payload["orderCode"] = int(ORDER_CODE)
print(f"    Da them orderCode={ORDER_CODE} vao payload")

# Bước 2: Gọi generate-pdf với orderCode
print(f"\n[2] Goi generate-pdf (voi orderCode={ORDER_CODE})...")
body = json.dumps(payload).encode("utf-8")
req2 = urllib.request.Request(
    "https://www.nghechonnguoi.com/api/generate-pdf",
    data=body,
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    with urllib.request.urlopen(req2, timeout=300) as r2:
        raw = r2.read()
    
    if raw[:4] == b'%PDF':
        print("    CANH BAO: Van nhan binary PDF (orderCode chua duoc doc?)")
        with open(f"Bao-Cao-{ORDER_CODE}-backup.pdf", "wb") as f:
            f.write(raw)
        print(f"    Da luu backup: Bao-Cao-{ORDER_CODE}-backup.pdf")
    else:
        result = json.loads(raw.decode("utf-8", errors="replace"))
        print(f"\n[3] KET QUA:")
        success = result.get("success")
        print(f"    success: {success}")
        print(f"    emailError: {result.get('emailError')}")
        if success:
            print(f"\n✅ THANH CONG! Email da gui den: {data.get('email')}")
        else:
            print(f"\n❌ That bai: {result}")

except urllib.error.HTTPError as e:
    err = e.read().decode("utf-8", errors="replace")
    print(f"    HTTP {e.code}: {err[:300]}")
except Exception as e:
    print(f"    Exception: {type(e).__name__}: {e}")
