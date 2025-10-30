import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
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
    });

    if (!round) {
      return NextResponse.json({ message: "Round not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...round,
      path: round.pathJson ? (round.pathJson as string[]) : [],
    });
  } catch (error) {
    console.error("Failed to load round", error);
    return NextResponse.json(
      { message: "Failed to load round" },
      { status: 500 },
    );
  }
}