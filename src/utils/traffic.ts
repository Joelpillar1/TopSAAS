// Helper functions for Traffic bidding calculations

export const TOTAL_MONTHLY_DIRECTORY_VISITS = 85000; // Simulated monthly visitors

/**
 * Calculates estimated traffic share percentage based on rank
 * Rank 1 captures ~38% of all clicks, Rank 2 ~19%, Rank 3 ~12%, etc.
 */
export function getTrafficSharePercent(rank: number): number {
  if (rank <= 0) return 0;
  if (rank === 1) return 38.5;
  if (rank === 2) return 19.2;
  if (rank === 3) return 11.8;
  if (rank === 4) return 7.6;
  if (rank === 5) return 5.4;
  if (rank === 6) return 4.1;
  if (rank === 7) return 3.2;
  if (rank === 8) return 2.6;
  if (rank === 9) return 2.1;
  if (rank === 10) return 1.7;
  // Lower ranks: decaying share
  const base = 1.7 * Math.pow(0.85, rank - 10);
  return Math.max(0.1, Number(base.toFixed(1)));
}

/**
 * Calculates estimated monthly visitor clicks delivered for a given rank
 */
export function getEstimatedMonthlyClicks(rank: number): number {
  const share = getTrafficSharePercent(rank);
  return Math.round((share / 100) * TOTAL_MONTHLY_DIRECTORY_VISITS);
}

/**
 * Calculates effective Cost Per Click (CPC)
 */
export function calculateCPC(totalBid: number, totalClicks: number): string {
  if (!totalClicks || totalClicks <= 0) {
    if (totalBid > 0) return `$${(totalBid / 100).toFixed(2)}`;
    return '$0.00';
  }
  const cpc = totalBid / totalClicks;
  return `$${cpc.toFixed(2)}`;
}
