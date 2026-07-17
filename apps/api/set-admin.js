const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email || email === '--list') {
    const users = await prisma.user.findMany({
      select: { email: true, name: true, role: true },
      orderBy: { createdAt: 'desc' },
    });
    console.log('\n📋 Danh sách users:');
    console.table(users);
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error('❌ Không tìm thấy user: ' + email);
    const all = await prisma.user.findMany({ select: { email: true, role: true }, orderBy: { createdAt: 'desc' }, take: 10 });
    console.log('\n📋 Các email hiện có:');
    console.table(all);
    process.exit(1);
  }

  await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
  console.log('\n✅ Đã set ADMIN cho: ' + email);
  console.log('   → Đăng nhập lại tại http://localhost:3000/auth/login\n');
}

main()
  .catch(function(e) { console.error(e); process.exit(1); })
  .finally(function() { prisma.$disconnect(); });
