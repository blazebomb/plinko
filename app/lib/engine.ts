import { createHash } from "crypto";
import { seedFromCombinedSeed } from "./fairness";

export type Peg = { leftBias: number };
export type PegMap = Peg[][];

export type SimulationInput = {
  combinedSeed: string;
  rows: number;
  dropColumn: number;
  biasAdjustmentPerColumn?: number;
};

export type SimulationResult = {
  pegMap: PegMap;
  pegMapHash: string;
  decisions: ("L" | "R")[];
  binIndex: number;
};

type PRNG = () => number;

/** Deterministic xorshift32 PRNG returning floats in [0, 1). */
function createXorShift32(seed: number): PRNG {
  let state = seed >>> 0;

  if (state === 0) {
    state = 0x9e3779b9;
  }

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
}

function clamp(value: number, min: number, max: number) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Builds the peg map:
 * - Row 0 has 1 peg, row 1 has 2 pegs, ...
 * - Each peg bias is ~0.5 with +/- 0.1 variance.
 * - Bias values are rounded to 6 decimals for hash stability.
 */
export function generatePegMap(prng: PRNG, rows: number): PegMap {
  const map: PegMap = [];

  for (let row = 0; row < rows; row += 1) {
    const pegs: Peg[] = [];

    for (let peg = 0; peg <= row; peg += 1) {
      const raw = prng();
      const leftBias = parseFloat((0.5 + (raw - 0.5) * 0.2).toFixed(6));
      pegs.push({ leftBias });
    }

    map.push(pegs);
  }

  return map;
}

/** Hash the entire peg map so anyone can verify we used the same layout. */
export function hashPegMap(pegMap: PegMap) {
  return createHash("sha256")
    .update(JSON.stringify(pegMap))
    .digest("hex");
}

/**
 * Simulate the deterministic plinko run.
 * 1) Seed PRNG from combined seed.
 * 2) Generate peg biases using the PRNG.
 * 3) Use the remaining stream to choose left/right per row.
 * 4) Count right moves to get the landing bin index.
 */
export function simulatePlinko(input: SimulationInput): SimulationResult {
  const {
    combinedSeed,
    rows,
    dropColumn,
    biasAdjustmentPerColumn = 0.01,
  } = input;

  const seed = seedFromCombinedSeed(combinedSeed);
  const prng = createXorShift32(seed);

  const pegMap = generatePegMap(prng, rows);
  const pegMapHash = hashPegMap(pegMap);

  const decisions: ("L" | "R")[] = [];
  const centerColumn = Math.floor(rows / 2);
  const adjustment = (dropColumn - centerColumn) * biasAdjustmentPerColumn;

  let rightMoves = 0;

  for (let row = 0; row < rows; row += 1) {
    const pegIndex = Math.min(rightMoves, row);
    const baseBias = pegMap[row][pegIndex].leftBias;
    const adjustedBias = clamp(baseBias + adjustment, 0, 1);
    const rnd = prng();

    if (rnd < adjustedBias) {
      decisions.push("L");
    } else {
      decisions.push("R");
      rightMoves += 1;
    }
  }

  return {
    pegMap,
    pegMapHash,
    decisions,
    binIndex: rightMoves,
  };
}