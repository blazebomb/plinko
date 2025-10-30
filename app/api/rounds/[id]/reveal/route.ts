import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: roundId } = await params;

    if (!roundId || typeof roundId !== "string" || roundId.trim().length === 0) {
      return NextResponse.json({ message: "Round id is missing" }, { status: 400 });
    }

    const round = await prisma.round.findUnique({
      where: { id: roundId },
      select: {
        status: true,
        serverSeed: true,
        commitHex: true,
        nonce: true,
        revealedAt: true,
      },
    });

    if (!round) {
      return NextResponse.json({ message: "Round not found" }, { status: 404 });
    }

    if (!round.serverSeed) {
      return NextResponse.json(
        { message: "Server seed missing for this round" },
        { status: 400 },
      );
    }

    if (round.status === "REVEALED") {
      return NextResponse.json({
        roundId,
        serverSeed: round.serverSeed,
        commitHex: round.commitHex,
        nonce: round.nonce,
        revealedAt: round.revealedAt,
      });
    }

    if (round.status !== "STARTED") {
      return NextResponse.json(
        { message: "Round must be started before it can be revealed" },
        { status: 400 },
      );
    }

    const updated = await prisma.round.update({
      where: { id: roundId },
      data: {
        status: "REVEALED",
        revealedAt: new Date(),
      },
      select: {
        id: true,
        serverSeed: true,
        commitHex: true,
        nonce: true,
        revealedAt: true,
      },
    });

    return NextResponse.json({
      roundId: updated.id,
      serverSeed: updated.serverSeed,
      commitHex: updated.commitHex,
      nonce: updated.nonce,
      revealedAt: updated.revealedAt,
    });
  } catch (error) {
    console.error("Failed to reveal round", error);
    return NextResponse.json(
      { message: "Failed to reveal round" },
      { status: 500 },
    );
  }
}