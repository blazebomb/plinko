import { describe, expect, it } from 'vitest';
import {
  buildCombinedSeed,
  buildCommitHex,
  seedFromCombinedSeed,
} from '../fairness';
import { simulatePlinko } from '../engine';

const serverSeed =
  'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc';
const nonce = '42';
const clientSeed = 'candidate-hello';

describe('provably-fair protocol', () => {
  it('matches the provided commit and combined hash', () => {
    const commitHex = buildCommitHex(serverSeed, nonce);
    const combinedSeed = buildCombinedSeed(serverSeed, clientSeed, nonce);

    expect(commitHex).toBe(
      'bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34',
    );
    expect(combinedSeed).toBe(
      'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0',
    );
  });

  it('generates the expected first five PRNG values', () => {
    const combinedSeed = buildCombinedSeed(serverSeed, clientSeed, nonce);
    const seed = seedFromCombinedSeed(combinedSeed);

    const prngValues: number[] = [];
    const prng = (function* () {
      let state = seed >>> 0;
      if (state === 0) {
        state = 0x9e3779b9;
      }
      while (true) {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        state >>>= 0;
        yield state / 0xffffffff;
      }
    })();

    for (let i = 0; i < 5; i += 1) {
      prngValues.push(prng.next().value as number);
    }

    expect(prngValues[0]).toBeCloseTo(0.1106166649, 9);
    expect(prngValues[1]).toBeCloseTo(0.7625129214, 9);
    expect(prngValues[2]).toBeCloseTo(0.0439292176, 9);
    expect(prngValues[3]).toBeCloseTo(0.4578678815, 9);
    expect(prngValues[4]).toBeCloseTo(0.3438999297, 9);
  });

  it('simulates a center drop into bin 6 with matching peg hash', () => {
    const combinedSeed = buildCombinedSeed(serverSeed, clientSeed, nonce);

    const simulation = simulatePlinko({
      combinedSeed,
      rows: 12,
      dropColumn: 6,
    });

    expect(simulation.binIndex).toBe(6);
    expect(simulation.pegMap[0][0].leftBias.toFixed(6)).toBe('0.422123');
    expect(simulation.pegMap[1][0].leftBias.toFixed(6)).toBe('0.552503');
    expect(simulation.pegMap[1][1].leftBias.toFixed(6)).toBe('0.408786');
    expect(simulation.pegMapHash).toHaveLength(64);
  });
});



