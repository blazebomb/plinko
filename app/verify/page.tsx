'use client';

import Link from 'next/link';
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

const LABELS = [
  { key: 'commitHex', label: 'Commit Hash' },
  { key: 'combinedSeed', label: 'Combined Seed' },
  { key: 'pegMapHash', label: 'Peg Map Hash' },
  { key: 'binIndex', label: 'Bin Index' },
] as const;

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

      if (roundId.trim().length > 0) {
        const roundResponse = await fetch(`/api/rounds/${roundId.trim()}`);
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
      setMessage(error instanceof Error ? error.message : 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const comparison = verifyResult && roundSummary
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

  const isVerified =
    comparison &&
    comparison.commitHex &&
    comparison.combinedSeed &&
    comparison.pegMapHash &&
    comparison.binIndex &&
    roundSummary?.dropColumn === dropColumn;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <header className="space-y-3 text-center">
          <div className="flex justify-between text-sm">
            <Link href="/" className="text-slate-300 underline-offset-4 hover:text-white hover:underline">
              Back to game
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Round Verifier</h1>
          <p className="text-sm text-slate-200">
            Paste the commit inputs and we will replay the deterministic engine. Add a round id if you want to compare against the stored record.
          </p>
        </header>

        <section className="rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-lg">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col text-sm">
              Server Seed
              <input
                value={serverSeed}
                onChange={(event) => setServerSeed(event.target.value)}
                className="mt-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-slate-50"
                required
              />
            </label>

            <label className="flex flex-col text-sm">
              Client Seed
              <input
                value={clientSeed}
                onChange={(event) => setClientSeed(event.target.value)}
                className="mt-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-slate-50"
                required
              />
            </label>

            <label className="flex flex-col text-sm">
              Nonce
              <input
                value={nonce}
                onChange={(event) => setNonce(event.target.value)}
                className="mt-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-slate-50"
                required
              />
            </label>

            <label className="flex flex-col text-sm">
              Drop Column
              <select
                value={dropColumn}
                onChange={(event) => setDropColumn(Number(event.target.value))}
                className="mt-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-slate-50"
              >
                {Array.from({ length: 13 }, (_, idx) => (
                  <option key={idx} value={idx}>
                    Column {idx}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col text-sm">
              Rows
              <input
                type="number"
                min={1}
                value={rows}
                onChange={(event) => setRows(Number(event.target.value))}
                className="mt-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-slate-50"
              />
            </label>

            <label className="flex flex-col text-sm">
              Round ID (optional)
              <input
                value={roundId}
                onChange={(event) => setRoundId(event.target.value)}
                className="mt-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-slate-50"
                placeholder="clxxxx..."
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="col-span-full rounded bg-blue-500 px-4 py-2 font-medium text-white transition hover:bg-blue-400 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Verify Outcome'}
            </button>
          </form>

          {message && (
            <p className="mt-4 rounded bg-slate-900/60 px-3 py-2 text-sm text-slate-200">
              {message}
            </p>
          )}
        </section>

        {verifyResult && (
          <section className="rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-lg">
            <h2 className="font-semibold">Recomputed Values</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {LABELS.map(({ key, label }) => (
                <div key={key}>
                  <dt className="font-medium">{label}</dt>
                  <dd className="wrap-break-word rounded bg-slate-900/70 px-2 py-1 font-mono text-xs">
                    {String(verifyResult[key])}
                  </dd>
                </div>
              ))}
              <div>
                <dt className="font-medium">Decisions</dt>
                <dd className="rounded bg-slate-900/70 px-2 py-1 font-mono text-xs">
                  {verifyResult.decisions.join(", ")}
                </dd>
              </div>
            </dl>
          </section>
        )}

        {roundSummary && (
          <section className="rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-lg">
            <h2 className="font-semibold">Stored Round Snapshot</h2>
            <p className="text-sm text-slate-200">
              Loaded from <code>/api/rounds/{'{roundId}'}</code> for comparison.
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="font-medium">Round ID</dt>
                <dd className="font-mono text-xs">{roundSummary.id}</dd>
              </div>
              {LABELS.map(({ key, label }) => (
                <div key={key}>
                  <dt className="font-medium">{label}</dt>
                  <dd className="wrap-break-word rounded bg-slate-900/70 px-2 py-1 font-mono text-xs">
                    {roundSummary[key] ?? 'N/A'}
                  </dd>
                </div>
              ))}
              <div>
                <dt className="font-medium">Drop Column</dt>
                <dd className="font-mono text-xs">{roundSummary.dropColumn ?? 'N/A'}</dd>
              </div>
            </dl>
          </section>
        )}

        {comparison && (
          <section className="rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-lg">
            <h2 className="font-semibold">Comparison</h2>
            <p className="text-sm text-slate-200">
              Each field below is checked against the stored round. All green means the round is proven fair.
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {LABELS.map(({ key, label }) => (
                <li key={key}>
                  <span className="font-medium">{label}:</span> 
                  <span className={comparison[key] ? 'text-emerald-300' : 'text-red-400'}>
                    {comparison[key] ? 'Match' : 'Mismatch'}
                  </span>
                </li>
              ))}
              <li>
                <span className="font-medium">Drop Column:</span> 
                <span className={roundSummary?.dropColumn === dropColumn ? 'text-emerald-300' : 'text-red-400'}>
                  {roundSummary?.dropColumn === dropColumn ? 'Match' : 'Mismatch'}
                </span>
              </li>
            </ul>

            <p className="mt-3 font-semibold">
              Overall status: 
              <span className={isVerified ? 'text-emerald-300' : 'text-red-400'}>
                {isVerified ? 'Verified' : 'Different'}
              </span>
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
