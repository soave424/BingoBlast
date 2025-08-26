'use client';
import type { FC } from 'react';
import { cn } from '@/lib/utils';
import { checkBingo } from '@/lib/game-utils';

interface BingoBoardProps {
  size: number;
  board: string[];
  marked: boolean[];
  isMyTurn?: boolean;
  isHost?: boolean;
  onCellClick?: (word: string, index: number) => void;
  className?: string;
  isInteractive: boolean;
}

export const BingoBoard: FC<BingoBoardProps> = ({
  size,
  board,
  marked,
  onCellClick,
  className,
  isInteractive,
}) => {
  const bingoLines = checkBingo(marked, size);

  return (
    <div className={cn('relative aspect-square', className)}>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {board.map((word, i) => {
          const isMarked = marked[i];
          const canClick = isInteractive && !isMarked && onCellClick;
          return (
            <div
              key={i}
              onClick={() => canClick && onCellClick(word, i)}
              className={cn(
                'bingo-cell aspect-square flex items-center justify-center p-1 rounded-md text-center text-xs sm:text-sm md:text-base break-words transition-all duration-300',
                isMarked ? 'marked' : 'bg-secondary',
                canClick && 'cursor-pointer hover:bg-primary/20 transform hover:scale-105'
              )}
              title={word}
            >
              <span className={cn(isMarked && 'opacity-0')}>{word}</span>
            </div>
          );
        })}
      </div>
      {bingoLines.length > 0 && (
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
        >
          {bingoLines.map(line => {
            const cellSize = 100 / size;
            const halfCell = cellSize / 2;
            const [type, indexStr] = line.split('-');
            const index = parseInt(indexStr);

            let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

            if (type === 'row') {
              y1 = y2 = index * cellSize + halfCell;
              x2 = 100;
            } else if (type === 'col') {
              x1 = x2 = index * cellSize + halfCell;
              y2 = 100;
            } else if (type === 'diag' && index === 1) { // L-R
              x2 = 100;
              y2 = 100;
            } else if (type === 'diag' && index === 2) { // R-L
              x1 = 100;
              y2 = 100;
            }

            return (
              <line
                key={line}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className="stroke-accent"
                strokeWidth="5"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      )}
    </div>
  );
};
