export interface Player {
  id: string;
  nickname: string;
  isReady: boolean;
  board: string[];
  marked: boolean[];
  bingoCount: number;
  isWinner: boolean;
  lastBingoTimestamp?: number; // 마지막 빙고 달성 시간
}

export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface WordRequest {
  requestId: string;
  userId: string;
  nickname: string;
  word: string;
  index: number;
}

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
  wordRequests: WordRequest[];
}
