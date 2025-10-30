'use client';

import { useState } from 'react';

type CommitResponse = {
  roundId: string;
  commitHex: string;
  nonce: string;
};

type StartInput = {
  clientSeed: string;
  betCents: number;
  dropColumn: number;
};

type StartResponse = {
  roundId: string;
  status: string;
  dropColumn: number;
  binIndex: number;
  payoutMultiplier: number;
  betCents: number;
  pegMapHash: string;
  combinedSeed: string;
  decisions: ('L' | 'R')[];
};

type RevealResponse = {
  roundId: string;
  serverSeed: string;
  commitHex: string;
  nonce: string;
  revealedAt: string;
};

export type RoundState = {
  commit?: CommitResponse;
  started?: StartResponse;
  reveal?: RevealResponse;
  error?: string;
};

export function useRoundFlow() {
  const [state, setState] = useState<RoundState>({});

  async function commitRound() {
    try {
      const res = await fetch('/api/rounds/commit', { method: 'POST' });
      if (!res.ok) throw new Error('Commit failed');

      const data = (await res.json()) as CommitResponse;
      setState({ commit: data });
      return data;
    } catch (error) {
      console.error(error);
      setState({ error: 'Could not start a new round. Try again.' });
      throw error;
    }
  }

  async function startRound(input: StartInput) {
    if (!state.commit) throw new Error('Call commitRound first');

    try {
      const res = await fetch(`/api/rounds/${state.commit.roundId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.message ?? 'Start failed');
      }

      const data = (await res.json()) as StartResponse;

      setState((prev) => ({
        ...prev,
        started: data,
        error: undefined,
      }));

      return data;
    } catch (error) {
      console.error(error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Could not start the round.',
      }));
      throw error;
    }
  }

  async function revealRound() {
    if (!state.commit) throw new Error('Call commitRound first');

    try {
      const res = await fetch(`/api/rounds/${state.commit.roundId}/reveal`, {
        method: 'POST',
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.message ?? 'Reveal failed');
      }

      const data = (await res.json()) as RevealResponse;

      setState((prev) => ({
        ...prev,
        reveal: data,
        error: undefined,
      }));

      return data;
    } catch (error) {
      console.error(error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Could not reveal the round.',
      }));
      throw error;
    }
  }

  function reset() {
    setState({});
  }

  return {
    state,
    commitRound,
    startRound,
    revealRound,
    reset,
  };
}
