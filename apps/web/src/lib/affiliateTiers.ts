export interface AffiliateTier {
    name: string;
    minOrders: number;
    commissionRate: number;
}

export const AFFILIATE_TIERS: AffiliateTier[] = [
    { name: "Kim Cương", minOrders: 100, commissionRate: 0.30 },
    { name: "Vàng", minOrders: 50, commissionRate: 0.26 },
    { name: "Bạc", minOrders: 20, commissionRate: 0.22 },
    { name: "Thành viên", minOrders: 0, commissionRate: 0.20 },
];

export function getTierByOrderCount(totalPaidOrders: number): AffiliateTier {
    for (const tier of AFFILIATE_TIERS) {
        if (totalPaidOrders >= tier.minOrders) return tier;
    }
    return AFFILIATE_TIERS[AFFILIATE_TIERS.length - 1];
}