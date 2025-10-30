import { NextResponse } from "next/server";
import { buildCombinedSeed } from "@/app/lib/fairness";
import { simulatePlinko } from "@/app/lib/engine";
import { getPayoutMultiplier } from "@/app/lib/payout";
import { prisma } from "@/app/lib/prisma";

type StartBody = {
  clientSeed?: string;
  betCents?: number;
  dropColumn?: number;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: roundId } = await params;

    if (!roundId || typeof roundId !== "string" || roundId.trim().length === 0) {
      return NextResponse.json({ message: "Round id is missing" }, { status: 400 });
    }

    const body: StartBody = await request.json();

    const errors: string[] = [];
    if (!body.clientSeed || body.clientSeed.trim().length === 0) {
      errors.push("clientSeed is required");
    }
    if (typeof body.betCents !== "number" || body.betCents <= 0) {
      errors.push("betCents must be a positive number");
    }
    if (
      typeof body.dropColumn !== "number" ||
      body.dropColumn < 0 ||
      body.dropColumn > 12
    ) {
      errors.push("dropColumn must be between 0 and 12");
    }

    if (errors.length > 0) {
      return NextResponse.json({ message: errors.join(", ") }, { status: 400 });
    }

    const round = await prisma.round.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      return NextResponse.json({ message: "Round not found" }, { status: 404 });
    }

    if (round.status !== "CREATED" || !round.serverSeed) {
      return NextResponse.json(
        { message: "Round is not ready to start" },
        { status: 400 },
      );
    }

    const clientSeed = body.clientSeed!.trim();
    const betCents = Math.floor(body.betCents!);
    const dropColumn = body.dropColumn!;
    const rows = round.rows ?? 12;

    const combinedSeed = buildCombinedSeed(
      round.serverSeed,
      clientSeed,
      round.nonce,
    );

    const simulation = simulatePlinko({
      combinedSeed,
      rows,
      dropColumn,
    });

    const payoutMultiplier = getPayoutMultiplier(simulation.binIndex);

    const updated = await prisma.round.update({
      where: { id: roundId },
      data: {
        status: "STARTED",
        clientSeed,
        combinedSeed,
        pegMapHash: simulation.pegMapHash,
        dropColumn,
        binIndex: simulation.binIndex,
        payoutMultiplier,
        betCents,
        pathJson: simulation.decisions,
      },
      select: {
        id: true,
        status: true,
        dropColumn: true,
        binIndex: true,
        payoutMultiplier: true,
        betCents: true,
        pegMapHash: true,
        combinedSeed: true,
      },
    });

    return NextResponse.json({
      roundId: updated.id,
      status: updated.status,
      dropColumn: updated.dropColumn,
      binIndex: updated.binIndex,
      payoutMultiplier: updated.payoutMultiplier,
      betCents: updated.betCents,
      pegMapHash: updated.pegMapHash,
      combinedSeed: updated.combinedSeed,
      decisions: simulation.decisions,
    });
  } catch (error) {
    console.error("Failed to start round", error);
    return NextResponse.json(
      { message: "Failed to start round" },
      { status: 500 },
    );
  }
}