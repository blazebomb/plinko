'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { PlinkoBoard } from './components/PlinkoBoard';
import { useRoundFlow } from './hooks/useRoundFlow';

const DROP_COLUMNS = Array.from({ length: 13 }, (_, idx) => idx);

export default function HomePage() {
  const { state, commitRound, startRound, revealRound, reset } = useRoundFlow();

  const [clientSeed, setClientSeed] = useState('player-seed');
  const [betCents, setBetCents] = useState(100);
  const [dropColumn, setDropColumn] = useState(6);
  const [loading, setLoading] = useState<'commit' | 'start' | 'reveal' | null>(null);

  const hasCommit = Boolean(state.commit);
  const roundStarted = Boolean(state.started);
  const canDrop = hasCommit && !roundStarted && loading === null;
  const canReveal = roundStarted && loading === null;

  const runStart = useCallback(async () => {
    if (!hasCommit || !canDrop) return;
    setLoading('start');
    try {
      await startRound({ clientSeed, betCents, dropColumn });
    } finally {
      setLoading(null);
    }
  }, [hasCommit, canDrop, startRound, clientSeed, betCents, dropColumn]);

  async function handleCommit() {
    try {
      setLoading('commit');
      await commitRound();
    } finally {
      setLoading(null);
    }
  }

  async function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runStart();
  }

  async function handleReveal() {
    if (!hasCommit || !roundStarted || loading !== null) return;

    try {
      setLoading('reveal');
      await revealRound();
    } finally {
      setLoading(null);
    }
  }

  function handleReset() {
    reset();
    setClientSeed('player-seed');
    setBetCents(100);
    setDropColumn(6);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setDropColumn((prev) => Math.max(0, prev - 1));
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setDropColumn((prev) => Math.min(12, prev + 1));
      } else if (event.key === ' ' || event.key === 'Spacebar') {
        if (canDrop) {
          event.preventDefault();
          void runStart();
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canDrop, runStart]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Plinko Lab - Minimal Build</h1>
          <p className="text-sm text-slate-200">
            Click <strong>New Round</strong>, enter your seed / bet / column, then drop and reveal.
            Every number is driven by the deterministic engine and backed by our tests.
          </p>
        </header>

        <section className="rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-lg">
          <h2 className="font-semibold">1. Commit</h2>
          <p className="text-sm text-slate-200">
            The server picks a hidden <em>serverSeed</em> + <em>nonce</em>, stores the hash, and shares
            the commit so you can hold us accountable.
          </p>
          <button
            onClick={handleCommit}
            disabled={loading !== null}
            className="mt-3 rounded bg-blue-500 px-4 py-2 font-medium text-white transition hover:bg-blue-400 disabled:opacity-50"
          >
            {loading === 'commit' ? 'Creating...' : 'New Round'}
          </button>

          {state.commit && (
            <div className="mt-3 space-y-1 text-sm">
              <p>
                <span className="font-medium">Round ID:</span> {state.commit.roundId}
              </p>
              <p className="wrap-break-word">
                <span className="font-medium">Commit Hash:</span> {state.commit.commitHex}
              </p>
              <p>
                <span className="font-medium">Nonce:</span> {state.commit.nonce}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-lg">
          <h2 className="font-semibold">2. Start &amp; Simulate</h2>
          <p className="text-sm text-slate-200">
            Add your <em>clientSeed</em> plus bet + drop column. The engine combines the seeds,
            generates the peg map, and decides the entire path deterministically.
          </p>

          <form onSubmit={handleStart} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="flex flex-col text-sm">
              Client Seed
              <input
                type="text"
                value={clientSeed}
                onChange={(event) => setClientSeed(event.target.value)}
                disabled={!hasCommit || roundStarted || loading === 'start'}
                className="mt-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-slate-50"
                required
              />
            </label>

            <label className="flex flex-col text-sm">
              Bet (cents)
              <input
                type="number"
                min={1}
                value={betCents}
                onChange={(event) => setBetCents(Number(event.target.value))}
                disabled={!hasCommit || roundStarted || loading === 'start'}
                className="mt-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-slate-50"
                required
              />
            </label>

            <label className="flex flex-col text-sm">
              Drop Column
              <select
                value={dropColumn}
                onChange={(event) => setDropColumn(Number(event.target.value))}
                disabled={!hasCommit || roundStarted || loading === 'start'}
                className="mt-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-slate-50"
              >
                {DROP_COLUMNS.map((col) => (
                  <option key={col} value={col}>
                    Column {col}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={!canDrop}
              className="col-span-full rounded bg-emerald-500 px-4 py-2 font-medium text-white transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading === 'start' ? 'Simulating...' : 'Drop Ball'}
            </button>
          </form>

          {state.started && (
            <div className="mt-4 space-y-1 text-sm">
              <p className="font-medium">Simulation Output</p>
              <p>
                Bin Index: <strong>{state.started.binIndex}</strong>
              </p>
              <p>
                Payout Multiplier:{' '}
                <strong>{state.started.payoutMultiplier.toFixed(2)}x</strong>
              </p>
              <p>
                Peg Map Hash:{' '}
                <span className="wrap-break-word">{state.started.pegMapHash}</span>
              </p>
              <p>
                Combined Seed:{' '}
                <span className="wrap-break-word">{state.started.combinedSeed}</span>
              </p>
              <p>
                Decisions: <code>{state.started.decisions.join(', ')}</code>
              </p>
              {state.started.decisions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Path Preview</p>
                  <PlinkoBoard
                    rows={state.started.decisions.length}
                    decisions={state.started.decisions}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-lg">
          <h2 className="font-semibold">3. Reveal &amp; Verify</h2>
          <p className="text-sm text-slate-200">
            After the drop finishes, we reveal the server seed so you (or anyone else) can recompute
            the hash and path as proof of fairness.
          </p>

          <div className="mt-3 flex gap-3">
            <button
              onClick={handleReveal}
              disabled={!canReveal}
              className="rounded bg-purple-500 px-4 py-2 font-medium text-white transition hover:bg-purple-400 disabled:opacity-50"
            >
              {loading === 'reveal' ? 'Revealing...' : 'Reveal Server Seed'}
            </button>
            <button
              onClick={handleReset}
              className="rounded border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700/70"
            >
              Reset
            </button>
          </div>

          {state.reveal && (
            <div className="mt-4 space-y-1 text-sm">
              <p>
                Server Seed (share this after the round):
                <span className="mt-1 block wrap-break-word rounded bg-slate-900/70 px-2 py-1 font-mono text-xs">
                  {state.reveal.serverSeed}
                </span>
              </p>
              <p>
                Commit Hash Check:
                <span className="mt-1 block wrap-break-word rounded bg-slate-900/70 px-2 py-1 font-mono text-xs">
                  {state.reveal.commitHex}
                </span>
              </p>
              <p>
                Nonce: <code>{state.reveal.nonce}</code>
              </p>
              <p>
                Revealed At: <code>{state.reveal.revealedAt}</code>
              </p>
              {state.commit && (
                <p className="text-sm text-emerald-300">
                  Tip: Plug the commit, serverSeed, clientSeed, nonce, and drop column into the{' '}
                  <a href="/verify" className="underline">
                    /verify page
                  </a>{' '}
                  or hit <code>/api/verify</code> directly to check the outputs.
                </p>
              )}
            </div>
          )}

          {state.error && (
            <p className="mt-4 rounded bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {state.error}
            </p>
          )}
        </section>

        <section className="rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-lg">
          <h2 className="font-semibold">Paytable (fixed example)</h2>
          <p className="text-sm text-slate-200">
            Multiplier per bin (mirrors the simple symmetric payout we hardcoded).
          </p>
          <div className="mt-3 grid grid-cols-13 gap-1 text-center text-xs">
            {DROP_COLUMNS.map((bin) => (
              <div key={bin} className="rounded border border-slate-600 px-1 py-2">
                <p className="font-semibold">Bin {bin}</p>
                <p>
                  {bin === 0 || bin === 12
                    ? '15x'
                    : bin === 1 || bin === 11
                      ? '5x'
                      : bin === 2 || bin === 10
                        ? '3x'
                        : bin === 3 || bin === 9
                          ? '2x'
                          : bin === 4 || bin === 8
                            ? '1.5x'
                            : bin === 5 || bin === 7
                              ? '1.2x'
                              : '1x'}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}