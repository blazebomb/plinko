# Plinko Lab � Provably Fair Take-Home

This repo is my submission for the Daphnis Labs Plinko assignment. The goal was to build a provably fair Plinko game with a verifier page, keep the logic deterministic, and document the flow clearly. Stack is straight from the brief: Next.js (App Router) + TypeScript on the frontend, Prisma + Postgres (Neon) on the backend.

---

## What�s Inside

- **Next.js App Router** drives both UI (`app/`) and APIs (`app/api/`).
- **Prisma** talks to a Neon Postgres database. The Prisma client lives in `app/lib/prisma.ts` so hot reloads don�t spin up extra connections.
- **Game logic** sits in `app/lib`:
  - `fairness.ts` � commit/reveal hashes and seed helpers.
  - `engine.ts` � xorshift32 PRNG, peg map generation, deterministic path.
  - `payout.ts` � simple symmetric pay table.
- **Round flow hook** (`app/hooks/useRoundFlow.ts`) wraps commit ? start ? reveal calls for the React UI.
- **Vitest** covers the deterministic engine and the hash maths expected by the assignment�s reference vectors.

---

## Setting Up Locally

1. Install dependencies
   ```bash
   npm install
   ```
2. Create a Neon Postgres project and drop the credentials into `.env` (never commit real creds):
   ```ini
   DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
   DIRECT_URL="postgresql://user:password@host/db?sslmode=require"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```
3. Apply migrations and start the dev server
   ```bash
   npx prisma migrate dev --name init
   npm run dev
   ```
4. Open http://localhost:3000 and you�re on the minimal Plinko board.

Handy scripts:

| Command | What it does |
| ------- | ------------- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Runs the production build |
| `npm run lint` | ESLint with zero warning allowance |
| `npm run test` | Vitest suite |
| `npm run test:watch` | Vitest watch mode |

---

## Database Snapshot

`prisma/schema.prisma` models the single `Round` table exactly how the spec suggested, with nullable fields that get filled in during `start` and `reveal` phases. Prisma enum `RoundStatus` keeps transitions type-safe. Migrations run out of the box against Neon.

---

## API Routes

All routes return JSON and validate inputs on the server:

- `POST /api/rounds/commit` � server picks `serverSeed` + `nonce` and stores the commit hash. Response: `{ roundId, commitHex, nonce }`.
- `POST /api/rounds/:id/start` � takes `{ clientSeed, betCents, dropColumn }`, generates combined seed, peg map, path, payout, and updates the round.
- `POST /api/rounds/:id/reveal` � reveals the server seed once the drop is done.
- `GET /api/rounds/:id` � full round details including stored path.
- `GET /api/verify` � recomputes commit hash, combined seed, peg map hash & bin index for any given input.

Every handler now awaits the new App Router `params` promise so the round id is always available before touching Prisma.

---

## Fairness & Engine Brief

- Commit hash: `SHA256(serverSeed:nonce)`
- Combined seed: `SHA256(serverSeed:clientSeed:nonce)`
- PRNG: xorshift32, seeded from the first 4 bytes of `combinedSeed` (big-endian). Zero seed handled explicitly.
- Peg map: each row gets `row + 1` pegs, biases rounded to 6 decimals (`0.5 � 0.1` spread). Hash is SHA256 of the JSON.
- Drop logic: adjust bias by `(dropColumn - centre) * 0.01`, draw from PRNG, move left/right, count rights to get `binIndex`.
- Payout: static array `[15,5,3,2,1.5,1.2,1,...]` stored with the round.

The verifier page and unit tests both use the official reference seeds (`serverSeed`, `nonce`, `clientSeed`) to prove compatibility.

---

## Frontend Flow

- Step 1: Commit � shows round id, commit hash, nonce.
- Step 2: Start � form for client seed, bet (in cents), drop column. Arrow keys change the column, spacebar drops the ball when ready.
- Step 3: Reveal � exposes the server seed after start. Results panel links to `/verify`.
- `PlinkoBoard` gives a quick grid view of the deterministic path and landing bin.
- UI sticks to a clean dark palette so text is easy to read without fancy effects.

---

## Verifier Page

Visit `/verify`, fill in `serverSeed`, `clientSeed`, `nonce`, `dropColumn`, and optional `roundId`. The page calls `/api/verify`, recomputes the outputs, and (if `roundId` provided) compares the numbers with the stored round so you see a ?/? status. You can also hit the API directly if you need to automate checks.

---

## Tests

```bash
npm run test
```

Covers:
- Commit hash and combined seed against the reference values.
- First five xorshift draws.
- Peg map biases and final bin for the centre drop.

`npm run lint` keeps imports and unused code in check.

---

## AI Assistance Disclosure

I used ChatGPT (through Codex CLI) mainly for:
- sanity-checking the deterministic engine and hash flow,
- shaping the Vitest coverage given the official test vectors,
- nudging the dark theme layout.

Schema design, Prisma migrations, API route structure, validations, and round lifecycle decisions were done by hand. Wherever AI suggested code, I rewrote/adjusted it to fit the spec and ensure I understood the behaviour.

---

## Time Log & What�s Next

| Block | Notes |
| ----- | ----- |
| ~1 hr | Repo bootstrap, Prisma + Neon wiring, schema planning |
| ~2 hr | Commit/start/reveal/get/verify handlers, validation, Prisma integration |
| ~1.5 hr | Deterministic engine + fairness helpers + unit tests |
| ~2 hr | Frontend flow, keyboard controls, board preview |
| ~1.5 hr | Verifier page, documentation, polish, bug fixes |

If I had more time I�d add smoother drop animation (maybe a Matter.js visual layer while keeping deterministic logic authoritative), a rounds history view, and broader integration tests.

---

## Deployment Notes

- Set `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_APP_URL` in your hosting platform (Vercel etc.).
- Run `npx prisma migrate deploy` during build.
- Launch with `npm run build` followed by `npm run start`.

The app is ready for serverless environments since all randomness stays deterministic and transactions are straightforward.

---

Happy to share more context if needed. Thanks for reviewing the build!#
