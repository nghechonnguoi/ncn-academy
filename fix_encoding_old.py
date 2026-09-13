import re

# Đọc file gốc sạch (commit b63f5ea)
with open(r'd:\NCN-Academy\quiz-site\dashboard-result-original.js', 'r', encoding='utf-8-sig') as f:
    content = f.read()

print(f"File goc: {len(content)} chars")
print("Dong 9-11:", repr(content.split('\n')[8:11]))

# 1. Thay PRICE và API_BASE cũ
old_price_api = "  const PRICE = 568000;\n  const API_BASE = 'https://ncn-academy-web.vercel.app/api';"
new_price_api = (
    "  const CAMPAIGN_START = new Date('2026-07-15T00:00:00+07:00');\n"
    "  const CAMPAIGN_END   = new Date('2026-07-28T23:59:59+07:00');\n"
    "  const now = new Date();\n"
    "  const IS_CAMPAIGN = now >= CAMPAIGN_START && now <= CAMPAIGN_END;\n"
    "  const PRICE = IS_CAMPAIGN ? 399000 : 568000;\n"
    "  const PRICE_DISPLAY = IS_CAMPAIGN ? '399.000\u0111' : '568.000\u0111';\n"
    "  const PRICE_ORIGINAL_DISPLAY = IS_CAMPAIGN ? '568.000\u0111' : '1.358.000\u0111';\n"
    "  const BANK_BIN   = '970422';\n"
    "  const BANK_ACCT  = '768688678';\n"
    "  const BANK_OWNER = 'HO KINH DOANH NGHE CHON NGUOI';\n"
    "  const API_BASE = 'https://nghechonnguoi.com/api';"
)

if old_price_api in content:
    content = content.replace(old_price_api, new_price_api)
    print("OK: Thay PRICE + API_BASE thanh cong")
else:
    print("WARN: Khong tim thay doan PRICE+API_BASE")
    if "const PRICE = 568000" in content:
        print("  -> Tim thay PRICE rieng le")
    if "ncn-academy-web.vercel.app" in content:
        print("  -> Tim thay API_BASE cu")

# 2. Xoa PayOS, them VietQR truc tiep
old_payos = (
    "        const res = await fetch(`${API_BASE}/payos/create`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ orderCode: orderCodeNum, amount: finalAmount, description: `NCN ${orderCodeNum}`, buyerName: payload.HOTEN || '', buyerPhone: payload.DIEN_THOAI || '' }) });\n"
    "        const d = await res.json();\n"
    "        const bin = (d.data && d.data.bin) || 'OCB', acct = (d.data && d.data.accountNumber) || '61666666';\n"
    "        const owner = (d.data && d.data.accountName) || 'PHAM THI NGAN', desc = (d.data && d.data.description) || `NCN ${orderCodeNum}`, amt = (d.data && d.data.amount) || finalAmount;\n"
    "        showQR(`https://img.vietqr.io/image/${bin}-${acct}-compact2.png?amount=${amt}&addInfo=${encodeURIComponent(desc)}&accountName=${encodeURIComponent(owner)}`, desc, amt, orderCodeNum, payload);"
)
new_vietqr = (
    "        // Tao QR VietQR truc tiep - MB Bank, khong can PayOS\n"
    "        const desc = `NCN ${orderCodeNum}`;\n"
    "        const qrUrl = `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCT}-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(desc)}&accountName=${encodeURIComponent(BANK_OWNER)}`;\n"
    "        showQR(qrUrl, desc, finalAmount, orderCodeNum, payload);"
)

if old_payos in content:
    content = content.replace(old_payos, new_vietqr)
    print("OK: Xoa PayOS, them VietQR")
else:
    print("WARN: Khong tim thay doan PayOS")
    if "payos/create" in content:
        print("  -> Tim thay 'payos/create' rieng le")

# 3. Cap nhat hien thi gia trong modal (1.358.000d -> PRICE_ORIGINAL_DISPLAY, 568.000d -> PRICE_DISPLAY)
old_modal_price = ">1.358.000\u0111<"
new_modal_price = ">${PRICE_ORIGINAL_DISPLAY}<"
count1 = content.count(old_modal_price)
content = content.replace(old_modal_price, new_modal_price)
print(f"OK: Thay {count1} lan gia 1.358.000d")

old_modal_568 = ">568.000\u0111<"
new_modal_568 = ">${PRICE_DISPLAY}<"
count2 = content.count(old_modal_568)
content = content.replace(old_modal_568, new_modal_568)
print(f"OK: Thay {count2} lan gia 568.000d")

# Luu file ket qua voi UTF-8 (no BOM)
with open(r'd:\NCN-Academy\quiz-site\dashboard-result.js', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nXong! File moi: {len(content)} chars")

# Xac nhan cac thay doi chinh
print("\n=== XAC NHAN ===")
for line in content.split('\n')[:25]:
    if any(k in line for k in ['API_BASE', 'CAMPAIGN', 'BANK_', 'PRICE']):
        print(line)
