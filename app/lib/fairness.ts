import { randomBytes, createHash } from 'crypto';

/** 64-character hex string used as the server-side secret. */
export function generateServerSeed() {
  return randomBytes(32).toString('hex');
}

/** Shorter string that keeps each commit unique. */
export function generateNonce() {
  return randomBytes(8).toString('hex');
}

/** SHA-256 of "serverSeed:nonce"; this is what we publish before the round starts. */
export function buildCommitHex(serverSeed: string, nonce: string) {
  return createHash('sha256').update(`${serverSeed}:${nonce}`).digest('hex');
}

/** SHA-256 of "serverSeed:clientSeed:nonce"; seeds all deterministic randomness. */
export function buildCombinedSeed(
  serverSeed: string,
  clientSeed: string,
  nonce: string,
) {
  return createHash('sha256')
    .update(`${serverSeed}:${clientSeed}:${nonce}`)
    .digest('hex');
}

/** First four bytes of combined seed (big endian) interpreted as uint32. */
export function seedFromCombinedSeed(combinedSeed: string) {
  return parseInt(combinedSeed.slice(0, 8), 16) >>> 0;
}
