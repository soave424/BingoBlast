'use server';

import { Redis } from '@upstash/redis';
import type { Game, Player, WordRequest } from '@/lib/types';
import { generateRoomCode, checkBingo } from '@/lib/game-utils';

const redis = Redis.fromEnv();
const GAME_EXPIRATION_SECONDS = 60 * 60 * 2; // 2 hours

// Helper to get and lock a game
async function getAndLockGame(gameId: string): Promise<Game | null> {
    // NOTE: This is a simplified lock for demonstration.
    // In a high-concurrency production environment, you'd want a more robust distributed lock.
    const lockKey = `lock:${gameId}`;
    const locked = await redis.set(lockKey, 'locked', { nx: true, ex: 5 }); // Lock for 5 seconds
    if (!locked) {
        // Could wait and retry, but for this app, we'll just fail fast.
        console.warn(`Game ${gameId} is currently locked.`);
        return null;
    }
    return redis.get(gameId);
}

// Helper to unlock a game
async function unlockGame(gameId: string) {
    await redis.del(`lock:${gameId}`);
}


export async function createRoom({
    hostId, hostNickname, topic, size, winCondition, endCondition, isRandomFillEnabled, randomWords
}: {
    hostId: string; hostNickname: string; topic: string; size: number; winCondition: number; endCondition: number; isRandomFillEnabled: boolean; randomWords: string[];
}): Promise<Game | null> {
    const gameId = `game:${generateRoomCode()}`;
    
    const newGame: Game = {
        id: gameId,
        hostId,
        roomCode: gameId.split(':')[1],
        topic,
        size,
        winCondition,
        endCondition,
        isRandomFillEnabled,
        randomWords,
        status: 'waiting',
        players: {
            [hostId]: {
                id: hostId,
                nickname: hostNickname,
                isReady: false,
                board: [],
                marked: [],
                bingoCount: 0,
                isWinner: false,
            },
        },
        calledWords: [],
        turn: null,
        winners: [],
        wordRequests: [],
    };

    await redis.set(gameId, newGame, { ex: GAME_EXPIRATION_SECONDS });
    return newGame;
}

export async function joinRoom(roomCode: string, userId: string, nickname: string): Promise<{ game: Game | null, error?: string }> {
    const gameId = `game:${roomCode.toUpperCase()}`;
    const game: Game | null = await redis.get(gameId);

    if (!game) {
        return { game: null, error: "방을 찾을 수 없습니다." };
    }

    if (game.players[userId]) {
        return { game }; // Player is already in the game
    }
    
    if (Object.values(game.players).some(p => p.nickname === nickname)) {
        return { game: null, error: "이미 사용 중인 닉네임입니다." };
    }
    
    if (game.status !== 'waiting') {
        return { game: null, error: "이미 시작된 게임입니다." };
    }

    const newPlayer: Player = {
        id: userId,
        nickname,
        isReady: false,
        board: [],
        marked: [],
        bingoCount: 0,
        isWinner: false,
    };

    const updatedGame: Game = {
        ...game,
        players: {
            ...game.players,
            [userId]: newPlayer,
        }
    };
    await redis.set(gameId, updatedGame, { ex: GAME_EXPIRATION_SECONDS });
    return { game: updatedGame };
}

export async function getGame(gameId: string): Promise<Game | null> {
    return redis.get(gameId);
}

export async function submitBoard(gameId: string, userId: string, board: string[]): Promise<Game | null> {
    const game = await getAndLockGame(gameId);
    if (!game) return null;

    try {
        const marked = Array(game.size * game.size).fill(false);
        const updatedPlayers = {
            ...game.players,
            [userId]: {
                ...game.players[userId],
                board,
                marked,
                isReady: true,
            },
        };
        const updatedGame = { ...game, players: updatedPlayers };
        await redis.set(gameId, updatedGame, { ex: GAME_EXPIRATION_SECONDS });
        return updatedGame;
    } finally {
        await unlockGame(gameId);
    }
}

export async function startGame(gameId: string): Promise<{ game: Game | null, error?: string }> {
     const game = await getAndLockGame(gameId);
    if (!game) return { game: null, error: "게임 정보를 찾을 수 없습니다."};

    try {
        const allPlayersReady = Object.values(game.players).every(p => p.isReady);
        if (!allPlayersReady) {
            return { game, error: "모든 참가자가 준비를 완료해야 시작할 수 있습니다." };
        }
        if (Object.keys(game.players).length < 2) {
             return { game, error: "최소 2명 이상 참여해야 시작할 수 있습니다." };
        }

        const playerIds = Object.keys(game.players).filter(id => id !== game.hostId);
        const shuffledPlayerIds = playerIds.sort(() => Math.random() - 0.5);

        const updatedGame: Game = {
            ...game,
            status: 'playing',
            turn: shuffledPlayerIds[0],
        };

        await redis.set(gameId, updatedGame, { ex: GAME_EXPIRATION_SECONDS });
        return { game: updatedGame };
    } finally {
        await unlockGame(gameId);
    }
}


export async function callWord(gameId: string, userId: string, word: string): Promise<Game | null> {
    const game = await getAndLockGame(gameId);
    if (!game || game.turn !== userId || !word) return game;

    try {
        const updates: Partial<Game> = {
            calledWords: [...game.calledWords, word],
            players: { ...game.players },
        };
        let newWinners = [...game.winners];

        for (const pid of Object.keys(game.players)) {
            const player = game.players[pid];
            const newMarked = [...player.marked];
            let changed = false;
            player.board.forEach((cellWord, index) => {
                if (cellWord.trim().toLowerCase() === word.trim().toLowerCase()) {
                    if (!newMarked[index]) {
                        newMarked[index] = true;
                        changed = true;
                    }
                }
            });

            if (changed) {
                const newBingoCount = checkBingo(newMarked, game.size).length;
                updates.players![pid] = { ...player, marked: newMarked, bingoCount: newBingoCount };

                if (newBingoCount >= game.winCondition && !player.isWinner) {
                    updates.players![pid] = { ...updates.players![pid], isWinner: true };
                    if (!newWinners.includes(player.nickname)) {
                        newWinners.push(player.nickname);
                    }
                }
            }
        }

        updates.winners = newWinners;

        if (newWinners.length >= game.endCondition) {
            updates.status = 'finished';
        } else {
            const playerIds = Object.keys(game.players).filter(id => id !== game.hostId);
            const currentIndex = playerIds.indexOf(game.turn!);
            const nextIndex = (currentIndex + 1) % playerIds.length;
            updates.turn = playerIds[nextIndex];
        }

        const updatedGame = { ...game, ...updates };
        await redis.set(gameId, updatedGame, { ex: GAME_EXPIRATION_SECONDS });
        return updatedGame;
    } finally {
        await unlockGame(gameId);
    }
}

export async function setTurn(gameId: string, playerId: string): Promise<Game | null> {
    const game = await getAndLockGame(gameId);
    if (!game) return null;

    try {
        const updatedGame = { ...game, turn: playerId };
        await redis.set(gameId, updatedGame, { ex: GAME_EXPIRATION_SECONDS });
        return updatedGame;
    } finally {
        await unlockGame(gameId);
    }
}

export async function requestWordApproval(
    gameId: string, userId: string, word: string, index: number
): Promise<{game: Game | null, error?: string}> {
    const game = await getAndLockGame(gameId);
    if (!game) return { game: null, error: "게임을 찾을 수 없습니다."};

    try {
        const player = game.players[userId];
        if (!player) return { game, error: "플레이어를 찾을 수 없습니다." };

        const newRequest: WordRequest = {
            requestId: `${userId}-${index}`,
            userId,
            nickname: player.nickname,
            word,
            index,
        };

        const existingRequests = game.wordRequests || [];
        if (existingRequests.some(r => r.requestId === newRequest.requestId)) {
            return { game, error: "이미 해당 단어의 인정을 요청했습니다." };
        }

        const updatedGame = {
            ...game,
            wordRequests: [...existingRequests, newRequest],
        };
        await redis.set(gameId, updatedGame, { ex: GAME_EXPIRATION_SECONDS });
        return { game: updatedGame };
    } finally {
        await unlockGame(gameId);
    }
}

export async function resolveWordRequest(
    gameId: string, requestId: string, approve: boolean
): Promise<Game | null> {
    const game = await getAndLockGame(gameId);
    if (!game) return null;

    try {
        const request = game.wordRequests.find(r => r.requestId === requestId);
        let updatedGame = { ...game, wordRequests: game.wordRequests.filter(r => r.requestId !== requestId) };

        if (approve && request) {
            const player = updatedGame.players[request.userId];
            if (player) {
                const newMarked = [...player.marked];
                newMarked[request.index] = true;

                const newBingoCount = checkBingo(newMarked, game.size).length;
                let newWinners = [...updatedGame.winners];

                updatedGame.players[request.userId] = {
                    ...player,
                    marked: newMarked,
                    bingoCount: newBingoCount,
                };
                
                if (newBingoCount >= game.winCondition && !player.isWinner) {
                    updatedGame.players[request.userId].isWinner = true;
                    if (!newWinners.includes(player.nickname)) {
                        newWinners.push(player.nickname);
                        updatedGame.winners = newWinners;
                    }
                }

                if (newWinners.length >= game.endCondition) {
                    updatedGame.status = 'finished';
                }
            }
        }
        
        await redis.set(gameId, updatedGame, { ex: GAME_EXPIRATION_SECONDS });
        return updatedGame;

    } finally {
        await unlockGame(gameId);
    }
}
