import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('Generating 50 unique 100% off discount codes...');
  
  const prefixes = ['VIP', 'FREE', 'GIFT', 'NCN', 'PRO'];
  
  const codesData = [];
  for (let i = 0; i < 50; i++) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = nanoid(5).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
    const code = `${prefix}-${randomSuffix}`;
    
    codesData.push({
      code,
      discountPercent: 100,
      maxUses: 1,
    });
  }

  const result = await prisma.discountCode.createMany({
    data: codesData,
    skipDuplicates: true,
  });

  console.log(`Successfully created ${result.count} discount codes.`);
  
  const allCodes = await prisma.discountCode.findMany({
    orderBy: { createdAt: 'desc' },
    take: result.count
  });
  
  console.log('\n--- CÁC MÃ CỦA BẠN ---');
  console.log(allCodes.map(c => c.code).join('\n'));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
