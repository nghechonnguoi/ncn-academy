/**
 * Gọi bootstrap API để set ADMIN role cho email sau khi đăng ký
 * Chạy: node set-admin-production.js
 */
async function main() {
  const email = 'nghechonnguoi1@gmail.com';
  const secret = 'ncn-bootstrap-2026';

  console.log(`\n🔑 Set ADMIN cho: ${email}\n`);

  const res = await fetch('https://www.nghechonnguoi.com/api/admin/bootstrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, email }),
  });

  const data = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(JSON.stringify(data, null, 2));

  if (data.success) {
    console.log(`\n✅ ${data.message}`);
    console.log('→ Đăng xuất rồi đăng nhập lại để thấy role ADMIN.');
  } else {
    console.error(`\n❌ Lỗi: ${data.error}`);
  }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
