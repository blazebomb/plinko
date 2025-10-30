import { NextResponse } from "next/server";
import { buildCommitHex, generateNonce, generateServerSeed } from "@/app/lib/fairness";
import { prisma } from "@/app/lib/prisma";

export async function POST() {
  try {
    const serverSeed = generateServerSeed();
    const nonce = generateNonce();
    const commitHex = buildCommitHex(serverSeed, nonce);

    const round = await prisma.round.create({
      data: {
        status: "CREATED",
        serverSeed,
        nonce,
        commitHex,
        rows: 12,
      },
      select: {
        id: true,
        commitHex: true,
        nonce: true,
      },
    });

    return NextResponse.json({
      roundId: round.id,
      commitHex: round.commitHex,
      nonce: round.nonce,
    });
  } catch (error) {
    console.error("Error creating round", error);
    return NextResponse.json(
      { message: "Failed to create round" },
      { status: 500 },
    );
  }
}
