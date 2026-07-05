"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const nanoid_1 = require("nanoid");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Generating 50 unique 100% off discount codes...');
    const prefixes = ['VIP', 'FREE', 'GIFT', 'NCN', 'PRO'];
    const codesData = [];
    for (let i = 0; i < 50; i++) {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const randomSuffix = (0, nanoid_1.nanoid)(5).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
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
//# sourceMappingURL=seed-discount-codes.js.map