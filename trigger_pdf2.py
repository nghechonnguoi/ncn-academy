import sys, urllib.request, json, urllib.error

ORDER_CODE = "9807"

# Bước 1: Lấy payload
print("[1] Lay payload...")
req = urllib.request.Request(
    f"https://www.nghechonnguoi.com/api/admin/retry-pdf?orderCode={ORDER_CODE}&payload=true"
)
with urllib.request.urlopen(req, timeout=30) as r:
    data = json.loads(r.read())

payload = data.get("payload", {})
print(f"    Keys: {len(payload)} fields, Email: {data.get('email')}")

# Bước 2: Gọi generate-pdf và xem lỗi rõ ràng
print("\n[2] Goi generate-pdf...")
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
        print(f"    HTTP Status: 200")
        print(f"    Response (first 300 bytes raw): {repr(raw[:300])}")
        try:
            result = json.loads(raw.decode("utf-8", errors="replace"))
            print(f"    Parsed: {json.dumps(result, ensure_ascii=False)[:400]}")
        except:
            print("    Could not parse JSON")
except urllib.error.HTTPError as e:
    print(f"    HTTP Error: {e.code}")
    body_err = e.read().decode("utf-8", errors="replace")
    print(f"    Error body: {body_err[:500]}")
except Exception as e:
    print(f"    Exception: {type(e).__name__}: {e}")
