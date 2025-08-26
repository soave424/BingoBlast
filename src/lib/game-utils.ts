export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function reshapeArray<T>(flatArray: T[], size: number): T[][] {
  if (!flatArray || !size) return [];
  const reshaped: T[][] = [];
  for (let i = 0; i < flatArray.length; i += size) {
    reshaped.push(flatArray.slice(i, i + size));
  }
  return reshaped;
}

export function checkBingo(flatMarked: boolean[], size: number): string[] {
  if (!flatMarked || !size || flatMarked.length !== size * size) return [];
  const marked = reshapeArray(flatMarked, size);
  if (marked.length === 0) return [];

  let bingoLines: string[] = [];

  // Check rows and columns
  for (let i = 0; i < size; i++) {
    let rowBingo = true;
    let colBingo = true;
    for (let j = 0; j < size; j++) {
      if (!marked[i]?.[j]) rowBingo = false;
      if (!marked[j]?.[i]) colBingo = false;
    }
    if (rowBingo) bingoLines.push(`row-${i}`);
    if (colBingo) bingoLines.push(`col-${i}`);
  }

  // Check diagonals
  let diag1Bingo = true;
  let diag2Bingo = true;
  for (let i = 0; i < size; i++) {
    if (!marked[i]?.[i]) diag1Bingo = false;
    if (!marked[i]?.[size - 1 - i]) diag2Bingo = false;
  }
  if (diag1Bingo) bingoLines.push('diag-1');
  if (diag2Bingo) bingoLines.push('diag-2');
  
  return bingoLines;
}
