'use client';

type PlinkoBoardProps = {
  rows: number;
  decisions: ('L' | 'R')[];
};

export function PlinkoBoard({ rows, decisions }: PlinkoBoardProps) {
  // Track how many right moves have happened so far. This matches the deterministic engine logic.
  let rightMoves = 0;

  const pathIndices: number[] = [];
  for (let row = 0; row < rows; row += 1) {
    const pegIndex = Math.min(rightMoves, row);
    pathIndices[row] = pegIndex;

    const step = decisions[row];
    if (step === 'R') {
      rightMoves += 1;
    }
  }

  const board = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: row + 1 }, (_, peg) => ({
      row,
      peg,
      isPath: peg === pathIndices[row],
    })),
  );

  const finalBinIndex = rightMoves;

  return (
    <div className="flex flex-col items-center gap-3">
      {board.map((pegs, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-2">
          {pegs.map(({ peg, isPath }) => (
            <div
              key={`${rowIndex}-${peg}`}
              className={`h-3 w-3 rounded-full ${
                isPath ? 'bg-green-600' : 'bg-neutral-300'
              }`}
            />
          ))}
        </div>
      ))}
      <p className="text-xs text-neutral-600">
        Detected landing bin: <span className="font-semibold">{finalBinIndex}</span>
      </p>
    </div>
  );
}
