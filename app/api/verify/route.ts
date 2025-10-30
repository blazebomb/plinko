import { NextResponse } from "next/server";
import { buildCombinedSeed, buildCommitHex } from "@/app/lib/fairness";
import { simulatePlinko } from "@/app/lib/engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serverSeed = searchParams.get("serverSeed");
    const clientSeed = searchParams.get("clientSeed");
    const nonce = searchParams.get("nonce");
    const dropColumnParam = searchParams.get("dropColumn");
    const rowsParam = searchParams.get("rows");

    const errors: string[] = [];
    if (!serverSeed) errors.push("serverSeed is required");
    if (!clientSeed) errors.push("clientSeed is required");
    if (!nonce) errors.push("nonce is required");
    if (!dropColumnParam) errors.push("dropColumn is required");

    const dropColumn = dropColumnParam ? Number(dropColumnParam) : NaN;
    if (Number.isNaN(dropColumn) || dropColumn < 0 || dropColumn > 12) {
      errors.push("dropColumn must be a number between 0 and 12");
    }

    const rows = rowsParam ? Number(rowsParam) : 12;
    if (Number.isNaN(rows) || rows <= 0) {
      errors.push("rows must be a positive number");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { message: errors.join(", ") },
        { status: 400 },
      );
    }

    const commitHex = buildCommitHex(serverSeed!, nonce!);
    const combinedSeed = buildCombinedSeed(serverSeed!, clientSeed!, nonce!);

    const simulation = simulatePlinko({
      combinedSeed,
      rows,
      dropColumn,
    });

    return NextResponse.json({
      commitHex,
      combinedSeed,
      pegMapHash: simulation.pegMapHash,
      binIndex: simulation.binIndex,
      decisions: simulation.decisions,
    });
  } catch (error) {
    console.error("Failed to verify round", error);
    return NextResponse.json(
      { message: "Failed to verify round" },
      { status: 500 },
    );
  }
}
