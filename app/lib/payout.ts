// app/lib/payout.ts
const PAYOUTS = [
  15,  // bin 0
  5,   // bin 1
  3,   // bin 2
  2,   // bin 3
  1.5, // bin 4
  1.2, // bin 5
  1,   // bin 6 (center)
  1.2, // bin 7
  1.5, // bin 8
  2,   // bin 9
  3,   // bin 10
  5,   // bin 11
  15,  // bin 12
];

/** Returns a fair-ish symmetric multiplier; defaults to 1 if the bin is out of range */
export function getPayoutMultiplier(binIndex: number) {
  return PAYOUTS[binIndex] ?? 1;
}
