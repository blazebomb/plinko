'use client';

import { FormEvent, useState } from 'react';

type VerifyResult = {
  commitHex: string;
  combinedSeed: string;
  pegMapHash: string;
  binIndex: number;
  decisions: ('L' | 'R')[];
};

type RoundSummary = {
  id: string;
  commitHex: string;
  combinedSeed: string | null;
  pegMapHash: string | null;
  binIndex: number | null;
  dropColumn: number | null;
};

const labels = [
  { key: 'commitHex', label: 'Commit Hash' },
  { key: 'combinedSeed', label: 'Combined Seed' },
  { key: 'pegMapHash', label: 'Peg Map Hash' },
  { key: 'binIndex', label: 'Bin Index' },
];

export default function VerifyPage() {
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState('');
  const [dropColumn, setDropColumn] = useState(6);
  const [rows, setRows] = useState(12);
  const [roundId, setRoundId] = useState('');

  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage(null);
    setVerifyResult(null);
    setRoundSummary(null);

    try {
      const query = new URLSearchParams({
        serverSeed,
        clientSeed,
        nonce,
        dropColumn: String(dropColumn),
        rows: String(rows),
      });

      const verifyResponse = await fetch(`/api/verify?${query.toString()}`);

      if (!verifyResponse.ok) {
        const body = await verifyResponse.json();
        throw new Error(body?.message ?? 'Failed to verify round');
      }

      const verifyData = (await verifyResponse.json()) as VerifyResult;
      setVerifyResult(verifyData);

      if (roundId) {
        const roundResponse = await fetch(`/api/rounds/${roundId}`);
        if (!roundResponse.ok) {
          const body = await roundResponse.json();
          throw new Error(body?.message ?? 'Round lookup failed');
        }

        const roundData = await roundResponse.json();
        setRoundSummary({
          id: roundData.id,
          commitHex: roundData.commitHex,
          combinedSeed: roundData.combinedSeed,
          pegMapHash: roundData.pegMapHash,
          binIndex: roundData.binIndex,
          dropColumn: roundData.dropColumn,
        });
      }

      setMessage('Verification complete.');
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : 'Verification failed. Try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  const comparison =
    verifyResult && roundSummary
      ? {
          commitHex: verifyResult.commitHex === roundSummary.commitHex,
          combinedSeed:
            roundSummary.combinedSeed !== null &&
            verifyResult.combinedSeed === roundSummary.combinedSeed,
          pegMapHash:
            roundSummary.pegMapHash !== null &&
            verifyResult.pegMapHash === roundSummary.pegMapHash,
          binIndex:
            typeof roundSummary.binIndex === 'number' &&
            verifyResult.binIndex === roundSummary.binIndex,
        }
      : null;

  const showMatch =
    comparison &&
    comparison.commitHex &&
    comparison.combinedSeed &&
    comparison.pegMapHash &&
    comparison.binIndex &&
    roundSummary?.dropColumn === dropColumn;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Round Verifier</h1>
        <p className="text-sm text-neutral-600">
          Paste the server seed (revealed by the backend), your client seed, nonce, and drop column.
          We recompute the outcome using the deterministic engine. Optionally include a round ID to
          compare against stored results.
        </p>
      </header>

      <section className="rounded border border-neutral-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col text-sm">
            Server Seed
            <input
              value={serverSeed}
              onChange={(event) => setServerSeed(event.target.value)}
              className="mt-1 rounded border border-neutral-300 px-2 py-1"
              required
            />
          </label>

          <label className="flex flex-col text-sm">
            Client Seed
            <input
              value={clientSeed}
              onChange={(event) => setClientSeed(event.target.value)}
              className="mt-1 rounded border border-neutral-300 px-2 py-1"
              required
            />
          </label>

          <label className="flex flex-col text-sm">
            Nonce
            <input
              value={nonce}
              onChange={(event) => setNonce(event.target.value)}
              className="mt-1 rounded border border-neutral-300 px-2 py-1"
              required
            />
          </label>

          <label className="flex flex-col text-sm">
            Drop Column
            <select
              value={dropColumn}
              onChange={(event) => setDropColumn(Number(event.target.value))}
              className="mt-1 rounded border border-neutral-300 px-2 py-1"
            >
              {Array.from({ length: 13 }, (_, idx) => (
                <option key={idx} value={idx}>
                  Column {idx}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm">
            Rows (optional, default 12)
            <input
              type="number"
              min={1}
              value={rows}
              onChange={(event) => setRows(Number(event.target.value))}
              className="mt-1 rounded border border-neutral-300 px-2 py-1"
            />
          </label>

          <label className="flex flex-col text-sm">
            Round ID (optional, to cross-check DB record)
            <input
              value={roundId}
              onChange={(event) => setRoundId(event.target.value)}
              className="mt-1 rounded border border-neutral-300 px-2 py-1"
              placeholder="clxxxx..."
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="col-span-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Verify Outcome'}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
            {message}
          </p>
        )}
      </section>

      {verifyResult && (
        <section className="rounded border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Recomputed Values</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {labels.map(({ key, label }) => (
              <div key={key}>
                <dt className="font-medium">{label}</dt>
                <dd className="wrap-break-word rounded bg-neutral-100 px-2 py-1 font-mono text-xs">
                  {String(verifyResult[key as keyof VerifyResult])}
                </dd>
              </div>
            ))}
            <div>
              <dt className="font-medium">Decisions</dt>
              <dd className="rounded bg-neutral-100 px-2 py-1 font-mono text-xs">
                {verifyResult.decisions.join(', ')}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {roundSummary && (
        <section className="rounded border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Stored Round Snapshot</h2>
          <p className="text-sm text-neutral-600">
            Fetched from <code>/api/rounds/{'{roundId}'}</code>. We only return fields relevant to fairness comparison.
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="font-medium">Round ID</dt>
              <dd className="font-mono text-xs">{roundSummary.id}</dd>
            </div>
            {labels.map(({ key, label }) => (
              <div key={key}>
                <dt className="font-medium">{label}</dt>
                <dd className="wrap-break-word rounded bg-neutral-100 px-2 py-1 font-mono text-xs">
                  {roundSummary[key as keyof RoundSummary] ?? 'N/A'}
                </dd>
              </div>
            ))}
            <div>
              <dt className="font-medium">Drop Column</dt>
              <dd className="font-mono text-xs">
                {roundSummary.dropColumn ?? 'N/A'}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {comparison && (
        <section className="rounded border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Comparison</h2>
          <p className="text-sm text-neutral-600">
            We check the recomputed output against the stored round (if provided). A match on all
            fields plus drop column means the round is proven fair.
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {labels.map(({ key, label }) => (
              <li key={key}>
                <span className="font-medium">{label}:</span>{' '}
                <span className={comparison[key as keyof typeof comparison] ? 'text-green-700' : 'text-red-600'}>
                  {comparison[key as keyof typeof comparison] ? 'Match' : 'Mismatch'}
                </span>
              </li>
            ))}
            <li>
              <span className="font-medium">Drop Column:</span>{' '}
              <span className={roundSummary?.dropColumn === dropColumn ? 'text-green-700' : 'text-red-600'}>
                {roundSummary?.dropColumn === dropColumn ? 'Match' : 'Mismatch'}
              </span>
            </li>
          </ul>

          <p className="mt-3 font-semibold">
            Overall status:{' '}
            <span className={showMatch ? 'text-green-700' : 'text-red-600'}>
              {showMatch ? '✅ Verified' : '⚠ Different'}
            </span>
          </p>
        </section>
      )}
    </main>
  );
}
