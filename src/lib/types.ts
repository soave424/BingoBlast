export interface Player {
  id: string;
  nickname: string;
  isReady: boolean;
  board: string[];
  marked: boolean[];
  bingoCount: number;
  isWinner: boolean;
}

export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface Game {
  id: string;
  hostId: string;
  roomCode: string;
  topic: string;
  size: number;
  winCondition: number;
  endCondition: number;
  isRandomFillEnabled: boolean;
  randomWords: string[];
  status: GameStatus;
  players: Record<string, Player>;
  calledWords: string[];
  turn: string | null; // Player ID
  winners: string[]; // Array of nicknames
}
